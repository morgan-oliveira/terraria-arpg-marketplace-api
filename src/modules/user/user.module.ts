import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from '../hash/hash.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResendModule } from '../resend/resend.module';
import { ModAuthModule } from '../../common/services/mod-auth.module';

@Module({
  imports: [ResendModule, ModAuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, HashService],
})
export class UserModule {}
