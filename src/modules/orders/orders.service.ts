import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createOrderDto: CreateOrderDto) {
    try {
      // check if every item for this order is available
      return await this.prisma.$transaction(async (prisma) => {
        for (const item of createOrderDto.Items) {
          if (item.status != "AVAILABLE") {
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
      })
    } catch (error) {
      handlePrismaError(error, 'Could not create order');
    }
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
