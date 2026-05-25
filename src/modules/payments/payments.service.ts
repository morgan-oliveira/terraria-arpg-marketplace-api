import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Status } from 'prisma/@prisma/client/enums';
import { TransactionIsolationLevel } from 'prisma/@prisma/client/internal/prismaNamespace';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';

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
  constructor(private readonly prisma: PrismaService) {}

  async payItemWithCoins(userId: string, itemId: string) {
    try {
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
            throw new NotFoundException('Item not found');
          }

          if (item.orderId || item.status !== Status.AVAILABLE) {
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

          return prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.FINISHED },
            include: { Items: true },
          });
        },
        { isolationLevel: TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      handlePrismaError(error, 'Could not pay item with coins');
    }
  }

  async payCartWithCoins(userId: string, cartId: string) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: { Items: true },
          });

          if (!cart) {
            throw new NotFoundException('Cart not found');
          }

          if (cart.Items.length === 0) {
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
            throw new ConflictException('Could not finish payment');
          }

          return prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.FINISHED },
            include: { Items: true },
          });
        },
        { isolationLevel: TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
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
