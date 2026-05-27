import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  async create(createOrderDto: CreateOrderDto) {
    try {
      this.logger.info('Order creation requested', {
        context: OrdersService.name,
        orderId: createOrderDto.id,
        itemCount: createOrderDto.Items?.length ?? 0,
      });

      // check if every item for this order is available
      return await this.prisma.$transaction(async (prisma) => {
        for (const item of createOrderDto.Items) {
          if (item.status != "AVAILABLE") {
            this.logger.warn('Order creation failed: item unavailable', {
              context: OrdersService.name,
              orderId: createOrderDto.id,
              itemId: item.id,
              status: item.status,
            });
            throw new HttpException("One or more items are unavailable for purchase", HttpStatus.BAD_REQUEST);
          }
          // reserve items during order cycle
          if (item.status === "AVAILABLE") {
            await prisma.item.updateManyAndReturn({
              where: {
                id: item.id,
                status: "AVAILABLE"
              },
              data: {
                status: "RESERVED"
              }
            })
          }
        }

        this.logger.info('Order creation succeeded', {
          context: OrdersService.name,
          orderId: createOrderDto.id,
          itemCount: createOrderDto.Items.length,
        });
      })
    } catch (error) {
      this.logger.error('Order creation failed', {
        context: OrdersService.name,
        orderId: createOrderDto.id,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not create order');
    }
  }

  findAll() {
    this.logger.debug('Order list requested', {
      context: OrdersService.name,
    });

    return `This action returns all orders`;
  }

  findOne(id: number) {
    this.logger.debug('Order lookup requested', {
      context: OrdersService.name,
      orderId: id,
    });

    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    this.logger.info('Order update requested', {
      context: OrdersService.name,
      orderId: id,
    });

    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    this.logger.info('Order removal requested', {
      context: OrdersService.name,
      orderId: id,
    });

    return `This action removes a #${id} order`;
  }
}
