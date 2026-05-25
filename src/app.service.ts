import { Injectable } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { handlePrismaError } from './common/errors/prisma-error-handler';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService
  ){}
  async getHello() {
    try {
      const response = await this.prisma.testDatabase.create({
        data: {
          id: "Oi"
        }
      });
      return response;
    } catch (error) {
      handlePrismaError(error, 'Could not create test database record');
    }
  }
}
