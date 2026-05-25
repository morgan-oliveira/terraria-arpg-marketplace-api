import { Body, Controller, Param, Post } from '@nestjs/common';
import { PayWithCoinsDto } from './dto/pay-with-coins.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('items/:itemId/coins')
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
