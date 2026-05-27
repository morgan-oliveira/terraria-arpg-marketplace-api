import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um pedido e reserva os itens disponiveis.' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Pedido criado ou itens reservados.' })
  @ApiResponse({ status: 400, description: 'Um ou mais itens estao indisponiveis.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pedidos.' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pedido por ID.' })
  @ApiParam({ name: 'id', description: 'ID numerico do pedido usado pela rota atual.', example: randomUUID() })
  @ApiResponse({ status: 200, description: 'Pedido encontrado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Pedido nao encontrado.' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um pedido por ID.' })
  @ApiParam({ name: 'id', description: 'ID numerico do pedido usado pela rota atual.', example: 1 })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Pedido atualizado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um pedido por ID.' })
  @ApiParam({ name: 'id', description: 'ID numerico do pedido usado pela rota atual.', example: 1 })
  @ApiResponse({ status: 200, description: 'Pedido removido.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
