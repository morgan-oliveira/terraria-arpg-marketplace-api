import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Status } from 'prisma/@prisma/client/enums';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  private getPagination(page?: string, limit?: string) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const currentLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    return {
      page: currentPage,
      limit: currentLimit,
      skip: (currentPage - 1) * currentLimit,
    };
  }

  private getCartInclude(page?: string, limit?: string) {
    const pagination = this.getPagination(page, limit);

    return {
      Items: {
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: {
          name: 'asc',
        },
      },
    } as const;
  }

  async create() {
    try {
      return await this.prisma.cart.create({
        data: {},
        include: this.getCartInclude(),
      });
    } catch (error) {
      handlePrismaError(error, 'Could not create cart');
    }
  }

  async addToCart(cartId: string, itemId: string) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const cart = await prisma.cart.findUnique({
          where: { id: cartId },
          select: { id: true },
        });

        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            cartId: true,
            orderId: true,
            status: true,
          },
        });

        if (!item) {
          throw new NotFoundException('Item not found');
        }

        if (item.orderId) {
          throw new BadRequestException('Item is already linked to an order');
        }

        if (item.status !== Status.AVAILABLE) {
          throw new BadRequestException('Item is unavailable for purchase');
        }

        await prisma.item.update({
          where: { id: item.id },
          data: { cartId: cart.id },
        });

        return prisma.cart.findUnique({
          where: { id: cart.id },
          include: this.getCartInclude(),
        });
      });
    } catch (error) {
      handlePrismaError(error, 'Could not add item to cart');
    }
  }

  async removeFromCart(cartId: string, itemId: string) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            cartId: true,
          },
        });

        if (!item || item.cartId !== cartId) {
          throw new NotFoundException('Item not found in this cart');
        }

        await prisma.item.update({
          where: { id: item.id },
          data: { cartId: null },
        });

        return prisma.cart.findUnique({
          where: { id: cartId },
          include: this.getCartInclude(),
        });
      });
    } catch (error) {
      handlePrismaError(error, 'Could not remove item from cart');
    }
  }

  async clearCart(cartId: string) {
    try {
      await this.findOne(cartId);

      await this.prisma.item.updateMany({
        where: { cartId },
        data: { cartId: null },
      });

      return await this.findOne(cartId);
    } catch (error) {
      handlePrismaError(error, 'Could not clear cart');
    }
  }

  async findAll(page?: string, limit?: string) {
    try {
      const pagination = this.getPagination(page, limit);
      const [carts, total] = await this.prisma.$transaction([
        this.prisma.cart.findMany({
          skip: pagination.skip,
          take: pagination.limit,
          include: this.getCartInclude(),
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        this.prisma.cart.count(),
      ]);

      return {
        data: carts,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      handlePrismaError(error, 'Could not list carts');
    }
  }

  async findOne(id: string, page?: string, limit?: string) {
    try {
      const pagination = this.getPagination(page, limit);
      const cart = await this.prisma.cart.findUnique({
        where: { id },
        include: this.getCartInclude(page, limit),
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const totalItems = await this.prisma.item.count({
        where: { cartId: id },
      });

      return {
        ...cart,
        itemsMeta: {
          page: pagination.page,
          limit: pagination.limit,
          total: totalItems,
          totalPages: Math.ceil(totalItems / pagination.limit),
        },
      };
    } catch (error) {
      handlePrismaError(error, 'Could not find cart');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      return await this.prisma.$transaction(async (prisma) => {
        await prisma.item.updateMany({
          where: { cartId: id },
          data: { cartId: null },
        });

        return prisma.cart.delete({
          where: { id },
        });
      });
    } catch (error) {
      handlePrismaError(error, 'Could not delete cart');
    }
  }
}
