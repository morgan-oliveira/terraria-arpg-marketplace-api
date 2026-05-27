import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Status } from 'prisma/@prisma/client/enums';
import { TransactionIsolationLevel } from 'prisma/@prisma/client/internal/prismaNamespace';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

type TransactionClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type PayableItem = {
  id: string;
  price: number | null;
  sellerId: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async payItemWithCoins(userId: string, itemId: string) {
    try {
      this.logger.info('Pay item with coins requested', {
        context: PaymentsService.name,
        userId,
        itemId,
      });

      return await this.prisma.$transaction(
        async (prisma) => {
          const item = await prisma.item.findUnique({
            where: { id: itemId },
            select: {
              id: true,
              price: true,
              sellerId: true,
              status: true,
              orderId: true,
            },
          });

          if (!item) {
            this.logger.warn('Pay item failed: item not found', {
              context: PaymentsService.name,
              userId,
              itemId,
            });
            throw new NotFoundException('Item not found');
          }

          if (item.orderId || item.status !== Status.AVAILABLE) {
            this.logger.warn('Pay item failed: item unavailable', {
              context: PaymentsService.name,
              userId,
              itemId,
              status: item.status,
              orderId: item.orderId,
            });
            throw new ConflictException('Item is unavailable for purchase');
          }

          const reservedItems = await prisma.item.updateMany({
            where: {
              id: item.id,
              status: Status.AVAILABLE,
              orderId: null,
            },
            data: {
              status: Status.PROCESSING,
            },
          });

          if (reservedItems.count !== 1) {
            this.logger.warn('Pay item failed: reservation conflict', {
              context: PaymentsService.name,
              userId,
              itemId,
            });
            throw new ConflictException('Item is unavailable for purchase');
          }

          const totalPrice = this.getTotalPrice([item]);
          await this.debitBuyerCoins(prisma, userId, totalPrice);
          await this.creditSellerCoins(prisma, [
            { sellerId: item.sellerId, amount: totalPrice },
          ]);

          const order = await prisma.order.create({
            data: {
              totalPrice,
              status: OrderStatus.PROCESSING,
            },
          });

          await prisma.item.update({
            where: { id: item.id },
            data: {
              status: Status.SOLD,
              orderId: order.id,
              cartId: null,
            },
          });

          const finishedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.FINISHED },
            include: { Items: true },
          });

          this.logger.info('Pay item with coins succeeded', {
            context: PaymentsService.name,
            userId,
            itemId,
            orderId: order.id,
            totalPrice,
          });

          return finishedOrder;
        },
        { isolationLevel: TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.logger.error('Pay item with coins failed', {
        context: PaymentsService.name,
        userId,
        itemId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not pay item with coins');
    }
  }

  async payCartWithCoins(userId: string, cartId: string) {
    try {
      this.logger.info('Pay cart with coins requested', {
        context: PaymentsService.name,
        userId,
        cartId,
      });

      return await this.prisma.$transaction(
        async (prisma) => {
          const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { Items: true },
          });

          if (!cart) {
            this.logger.warn('Pay cart failed: cart not found', {
              context: PaymentsService.name,
              userId,
              cartId,
            });
            throw new NotFoundException('Cart not found');
          }

          if (cart.Items.length === 0) {
            this.logger.warn('Pay cart failed: cart is empty', {
              context: PaymentsService.name,
              userId,
              cartId,
            });
            throw new BadRequestException('Cart is empty');
          }

          const itemIds = cart.Items.map((item) => item.id);
          const reservedItems = await prisma.item.updateMany({
            where: {
              id: { in: itemIds },
              cartId,
              status: Status.AVAILABLE,
              orderId: null,
            },
            data: {
              status: Status.PROCESSING,
            },
          });

          if (reservedItems.count !== itemIds.length) {
            this.logger.warn('Pay cart failed: one or more items unavailable', {
              context: PaymentsService.name,
              userId,
              cartId,
              expectedItems: itemIds.length,
              reservedItems: reservedItems.count,
            });
            throw new ConflictException('One or more cart items are unavailable');
          }

          const totalPrice = this.getTotalPrice(cart.Items);
          await this.debitBuyerCoins(prisma, userId, totalPrice);
          await this.creditSellerCoins(prisma, this.getSellerPayouts(cart.Items));

          const order = await prisma.order.create({
            data: {
              totalPrice,
              status: OrderStatus.PROCESSING,
            },
          });

          const soldItems = await prisma.item.updateMany({
            where: {
              id: { in: itemIds },
              status: Status.PROCESSING,
            },
            data: {
              status: Status.SOLD,
              orderId: order.id,
              cartId: null,
            },
          });

          if (soldItems.count !== itemIds.length) {
            this.logger.warn('Pay cart failed: could not finish payment', {
              context: PaymentsService.name,
              userId,
              cartId,
              expectedItems: itemIds.length,
              soldItems: soldItems.count,
            });
            throw new ConflictException('Could not finish payment');
          }

          const finishedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.FINISHED },
            include: { Items: true },
          });

          this.logger.info('Pay cart with coins succeeded', {
            context: PaymentsService.name,
            userId,
            cartId,
            orderId: order.id,
            totalPrice,
            itemCount: itemIds.length,
          });

          return finishedOrder;
        },
        { isolationLevel: TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.logger.error('Pay cart with coins failed', {
        context: PaymentsService.name,
        userId,
        cartId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not pay cart with coins');
    }
  }

  private getTotalPrice(items: PayableItem[]) {
    return items.reduce((total, item) => total + (item.price ?? 0), 0);
  }

  private getSellerPayouts(items: PayableItem[]) {
    const payouts = new Map<string, number>();

    for (const item of items) {
      payouts.set(
        item.sellerId,
        (payouts.get(item.sellerId) ?? 0) + (item.price ?? 0),
      );
    }

    return Array.from(payouts, ([sellerId, amount]) => ({ sellerId, amount }));
  }

  private async debitBuyerCoins(
    prisma: TransactionClient,
    userId: string,
    totalPrice: number,
  ) {
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!buyer) {
      this.logger.warn('Payment debit failed: buyer not found', {
        context: PaymentsService.name,
        userId,
        totalPrice,
      });
      throw new NotFoundException('Buyer not found');
    }

    const debit = await prisma.user.updateMany({
      where: {
        id: userId,
        coins: { gte: totalPrice },
      },
      data: {
        coins: { decrement: totalPrice },
      },
    });

    if (debit.count !== 1) {
      this.logger.warn('Payment debit failed: insufficient coins', {
        context: PaymentsService.name,
        userId,
        totalPrice,
      });
      throw new BadRequestException('Insufficient coins');
    }
  }

  private async creditSellerCoins(
    prisma: TransactionClient,
    payouts: Array<{ sellerId: string; amount: number }>,
  ) {
    for (const payout of payouts) {
      if (payout.amount === 0) {
        continue;
      }

      await prisma.user.update({
        where: { id: payout.sellerId },
        data: {
          coins: { increment: payout.amount },
        },
      });
    }
  }
}
