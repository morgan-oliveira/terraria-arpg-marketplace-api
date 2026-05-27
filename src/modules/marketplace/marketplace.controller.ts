import { Controller, Get, Post, Patch, Param, Delete, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { ItemsService } from '../items/items.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly itemService: ItemsService,
  ) {}

  @Get('items')
  @ApiOperation({ summary: 'Lista itens disponiveis no marketplace com paginacao.' })
  @ApiQuery({ name: 'page', required: false, example: '1', description: 'Pagina desejada.' })
  @ApiQuery({ name: 'limit', required: false, example: '20', description: 'Quantidade por pagina, maximo 100.' })
  @ApiResponse({ status: 200, description: 'Lista paginada de itens.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  async getItems(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.itemService.findAll(page, limit);
  }

  @Post('cart')
  @ApiOperation({ summary: 'Cria um carrinho vazio.' })
  @ApiResponse({ status: 201, description: 'Carrinho criado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  createCart() {
    return this.marketplaceService.create();
  }

  @Get('cart')
  @ApiOperation({ summary: 'Lista carrinhos com paginacao.' })
  @ApiQuery({ name: 'page', required: false, example: '1', description: 'Pagina desejada.' })
  @ApiQuery({ name: 'limit', required: false, example: '20', description: 'Quantidade por pagina, maximo 100.' })
  @ApiResponse({ status: 200, description: 'Lista paginada de carrinhos.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  findAllCarts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.findAll(page, limit);
  }

  @Get('cart/:id')
  @ApiOperation({ summary: 'Busca um carrinho por ID, incluindo itens paginados.' })
  @ApiParam({ name: 'id', description: 'ID do carrinho.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiQuery({ name: 'page', required: false, example: '1', description: 'Pagina dos itens do carrinho.' })
  @ApiQuery({ name: 'limit', required: false, example: '20', description: 'Quantidade de itens por pagina, maximo 100.' })
  @ApiResponse({ status: 200, description: 'Carrinho encontrado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Carrinho nao encontrado.' })
  findOneCart(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findOne(id, page, limit);
  }

  @Patch('cart/:cartId/items/:itemId')
  @ApiOperation({ summary: 'Adiciona um item disponivel ao carrinho.' })
  @ApiParam({ name: 'cartId', description: 'ID do carrinho.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiParam({ name: 'itemId', description: 'ID do item.', example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3' })
  @ApiResponse({ status: 200, description: 'Item adicionado ao carrinho.' })
  @ApiResponse({ status: 400, description: 'Item indisponivel ou ja vinculado a pedido.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Carrinho ou item nao encontrado.' })
  addToCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.marketplaceService.addToCart(cartId, itemId);
  }

  @Delete('cart/:cartId/items/:itemId')
  @ApiOperation({ summary: 'Remove um item de um carrinho.' })
  @ApiParam({ name: 'cartId', description: 'ID do carrinho.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiParam({ name: 'itemId', description: 'ID do item.', example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3' })
  @ApiResponse({ status: 200, description: 'Item removido do carrinho.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Item nao encontrado neste carrinho.' })
  removeFromCart(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.marketplaceService.removeFromCart(cartId, itemId);
  }

  @Delete('cart/:id/items')
  @ApiOperation({ summary: 'Limpa todos os itens de um carrinho.' })
  @ApiParam({ name: 'id', description: 'ID do carrinho.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiResponse({ status: 200, description: 'Carrinho limpo.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Carrinho nao encontrado.' })
  clearCart(@Param('id') id: string) {
    return this.marketplaceService.clearCart(id);
  }

  @Delete('cart/:id')
  @ApiOperation({ summary: 'Remove um carrinho e desvincula seus itens.' })
  @ApiParam({ name: 'id', description: 'ID do carrinho.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiResponse({ status: 200, description: 'Carrinho removido.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Carrinho nao encontrado.' })
  removeCart(@Param('id') id: string) {
    return this.marketplaceService.remove(id);
  }
}
