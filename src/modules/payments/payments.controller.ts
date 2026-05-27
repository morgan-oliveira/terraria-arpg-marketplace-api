import { Body, Controller, Param, Post } from '@nestjs/common';
import { PayWithCoinsDto } from './dto/pay-with-coins.dto';
import { PaymentsService } from './payments.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('items/:itemId/coins')
  @ApiOperation({ summary: 'Compra um item unico usando coins do usuario.' })
  @ApiParam({ name: 'itemId', description: 'ID do item a comprar.', example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3' })
  @ApiBody({ type: PayWithCoinsDto })
  @ApiResponse({ status: 201, description: 'Pagamento concluido e pedido finalizado.' })
  @ApiResponse({ status: 400, description: 'Coins insuficientes.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Usuario comprador ou item nao encontrado.' })
  @ApiResponse({ status: 409, description: 'Item indisponivel para compra.' })
  payItemWithCoins(
    @Param('itemId') itemId: string,
    @Body() payWithCoinsDto: PayWithCoinsDto,
  ) {
    return this.paymentsService.payItemWithCoins(
      payWithCoinsDto.userId,
      itemId,
    );
  }

  @Post('carts/:cartId/coins')
  @ApiOperation({ summary: 'Compra todos os itens de um carrinho usando coins do usuario.' })
  @ApiParam({ name: 'cartId', description: 'ID do carrinho a pagar.', example: '0dc7200f-f8f8-4d83-b803-f3658764064c' })
  @ApiBody({ type: PayWithCoinsDto })
  @ApiResponse({ status: 201, description: 'Pagamento do carrinho concluido e pedido finalizado.' })
  @ApiResponse({ status: 400, description: 'Carrinho vazio ou coins insuficientes.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Usuario comprador ou carrinho nao encontrado.' })
  @ApiResponse({ status: 409, description: 'Um ou mais itens do carrinho estao indisponiveis.' })
  payCartWithCoins(
    @Param('cartId') cartId: string,
    @Body() payWithCoinsDto: PayWithCoinsDto,
  ) {
    return this.paymentsService.payCartWithCoins(
      payWithCoinsDto.userId,
      cartId,
    );
  }
}
