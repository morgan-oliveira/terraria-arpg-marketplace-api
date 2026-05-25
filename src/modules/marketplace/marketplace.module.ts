import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService, ItemsService, PrismaService],
})
export class MarketplaceModule {}
