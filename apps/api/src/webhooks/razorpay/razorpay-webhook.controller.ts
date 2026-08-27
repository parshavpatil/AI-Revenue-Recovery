import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { RazorpayWebhookService } from './razorpay-webhook.service';

@Controller('webhooks/razorpay')
export class RazorpayWebhookController {
  constructor(private readonly service: RazorpayWebhookService) {}

  @Post(':merchantId')
  handle(
    @Param('merchantId') merchantId: string,
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    if (!req.rawBody) throw new Error('Raw webhook body is unavailable.');
    return this.service.handle(merchantId, req.rawBody, signature);
  }
}
