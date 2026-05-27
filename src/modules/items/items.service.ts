import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { ModAuthService } from '../../common/services/mod-auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modAuthService: ModAuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
    try {
      this.logger.info('Item creation requested', {
        context: ItemsService.name,
        itemId: createItemDto.id,
        sellerId: createItemDto.sellerId,
        name: createItemDto.name,
        price: createItemDto.price,
        status: createItemDto.status,
        modType,
      });

      this.modAuthService.validateModApiKey(modType, modToken);

      const item = await this.prisma.item.create({
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

      this.logger.info('Item created successfully', {
        context: ItemsService.name,
        itemId: item.id,
        sellerId: item.sellerId,
        name: item.name,
        price: item.price,
        status: item.status,
      });

      return item;
    } catch (error) {
      this.logger.error('Item creation failed', {
        context: ItemsService.name,
        itemId: createItemDto.id,
        sellerId: createItemDto.sellerId,
        modType,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not create item');
    }
  }

  async findAll(page?: string, limit?: string) {
    try {
      const pagination = this.getPagination(page, limit);
      this.logger.debug('Item list requested', {
        context: ItemsService.name,
        page: pagination.page,
        limit: pagination.limit,
      });

      const [items, total] = await this.prisma.$transaction([
        this.prisma.item.findMany({
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: {
            name: 'asc',
          },
          include: {
            seller: true
          }
        }),
        this.prisma.item.count(),
      ]);

      this.logger.debug('Item list returned', {
        context: ItemsService.name,
        page: pagination.page,
        limit: pagination.limit,
        total,
        returned: items.length,
      });

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
      this.logger.error('Item list failed', {
        context: ItemsService.name,
        page,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not list items');
    }
  }

  async findOne(id: string) {
    try {
      this.logger.debug('Item lookup requested', {
        context: ItemsService.name,
        itemId: id,
      });

      const item = await this.prisma.item.findFirst({
        where: {
          id: id,
        },
        include: {
          seller: true
        }
      });
      if (!item) {
        this.logger.warn('Item lookup failed: item not found', {
          context: ItemsService.name,
          itemId: id,
        });
        throw new NotFoundException('Item not found');
      }

      this.logger.debug('Item lookup succeeded', {
        context: ItemsService.name,
        itemId: item.id,
        sellerId: item.sellerId,
        status: item.status,
      });

      return item;
    } catch (error) {
      this.logger.error('Item lookup failed', {
        context: ItemsService.name,
        itemId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not find item');
    }
  }

  async remove(id: string) {
    try {
      this.logger.info('Item removal requested', {
        context: ItemsService.name,
        itemId: id,
      });

      const item = await this.prisma.item.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!item) {
        this.logger.warn('Item removal failed: item not found', {
          context: ItemsService.name,
          itemId: id,
        });
        throw new NotFoundException('Item not found');
      }

      if (item.status === 'PROCESSING' || item.status === 'SOLD') {
        this.logger.warn('Item removal blocked: payment already started', {
          context: ItemsService.name,
          itemId: id,
          status: item.status,
        });
        throw new ConflictException('Item cannot be deleted after payment starts');
      }

      const deletedItem = await this.prisma.item.delete({
        where: { id },
      });

      this.logger.info('Item removed successfully', {
        context: ItemsService.name,
        itemId: deletedItem.id,
        status: deletedItem.status,
      });

      return deletedItem;
    } catch (error) {
      this.logger.error('Item removal failed', {
        context: ItemsService.name,
        itemId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not delete item');
    }
  }
}
