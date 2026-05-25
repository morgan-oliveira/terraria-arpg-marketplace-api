import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { ModAuthService } from '../../common/services/mod-auth.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modAuthService: ModAuthService,
  ) {}

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

  async create(createItemDto: CreateItemDto, modType: string, modToken: string) {
    this.modAuthService.validateModApiKey(modType, modToken);

    try {
      return await this.prisma.item.create({
        data: {
          id: createItemDto.id,
          name: createItemDto.name,
          price: createItemDto.price,
          itemData: createItemDto.itemData,
          status: createItemDto.status,
          sellerId: createItemDto.sellerId,
          orderId: createItemDto.orderId,
          cartId: createItemDto.cartId,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'Could not create item');
    }
  }

  async findAll(page?: string, limit?: string) {
    try {
      const pagination = this.getPagination(page, limit);
      const [items, total] = await this.prisma.$transaction([
        this.prisma.item.findMany({
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.item.count(),
      ]);

      return {
        data: items,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      handlePrismaError(error, 'Could not list items');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.item.findFirst({
        where: {
          id: id,
        },
      });
      if (!item) {
        throw new NotFoundException('Item not found');
      }
      return item;
    } catch (error) {
      handlePrismaError(error, 'Could not find item');
    }
  }

  update(id: number, updateItemDto: UpdateItemDto) {
    return `This action updates a #${id} item`;
  }

  async remove(id: string) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!item) {
        throw new NotFoundException('Item not found');
      }

      if (item.status === 'PROCESSING' || item.status === 'SOLD') {
        throw new ConflictException('Item cannot be deleted after payment starts');
      }

      return await this.prisma.item.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, 'Could not delete item');
    }
  }
}
