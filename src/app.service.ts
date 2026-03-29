import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService
  ){}
  async getHello() {
    const response = await this.prisma.testDatabase.create({
      data: {
        id: "Teste333"
      }
    });
    return response;
  }
}
