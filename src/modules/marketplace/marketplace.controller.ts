import { Controller, Get, Post, Patch, Param, Delete, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { ItemsService } from '../items/items.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly itemService: ItemsService,
  ) {}

  @Get('items')
  async getItems(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.itemService.findAll(page, limit);
  }

  @Post('cart')
  createCart() {
    return this.marketplaceService.create();
  }

  @Get('cart')
  findAllCarts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.findAll(page, limit);
  }

  @Get('cart/:id')
  findOneCart(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findOne(id, page, limit);
  }

  @Patch('cart/:cartId/items/:itemId')
  addToCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.marketplaceService.addToCart(cartId, itemId);
  }

  @Delete('cart/:cartId/items/:itemId')
  removeFromCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.marketplaceService.removeFromCart(cartId, itemId);
  }

  @Delete('cart/:id/items')
  clearCart(@Param('id') id: string) {
    return this.marketplaceService.clearCart(id);
  }

  @Delete('cart/:id')
  removeCart(@Param('id') id: string) {
    return this.marketplaceService.remove(id);
  }
}
