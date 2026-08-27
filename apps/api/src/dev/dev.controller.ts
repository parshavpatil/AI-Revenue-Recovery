import { Body, Controller, Post } from '@nestjs/common';
import { DevService } from './dev.service';

@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Post('simulate-payment-failure')
  async simulatePaymentFailure(
    @Body()
    body: {
      merchantId: string;
      customerId: string;
      amountPaise: number;
    },
  ) {
    return this.devService.simulatePaymentFailure(
      body.merchantId,
      body.customerId,
      Number(body.amountPaise),
    );
  }
}