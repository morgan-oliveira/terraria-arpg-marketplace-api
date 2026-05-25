import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ModAuthModule } from '../../common/services/mod-auth.module';
import { ModAuthService } from 'src/common/services/mod-auth.service';
import { MarketplaceService } from '../marketplace/marketplace.service';

@Module({
  imports: [ModAuthModule],
  controllers: [ItemsController],
  providers: [ItemsService, PrismaService, ModAuthService, MarketplaceService],
})
export class ItemsModule {}
