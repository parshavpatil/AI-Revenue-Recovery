import {
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';

import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { RazorpayService } from './razorpay.service';

@Controller()
export class RazorpayController {
  constructor(
    private readonly razorpayService: RazorpayService,
  ) {}

  @Post('merchants/:merchantId/payment-links')
  createPaymentLink(
    @Param('merchantId') merchantId: string,
    @Body() dto: CreatePaymentLinkDto,
  ) {
    return this.razorpayService.createPaymentLink(
      merchantId,
      dto,
    );
  }
}