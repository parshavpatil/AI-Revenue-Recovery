import { Module } from '@nestjs/common';
import { PaymentModule } from '../../payment/payment.module';
import { RecoveryModule } from '../../recovery/recovery.module';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayWebhookService } from './razorpay-webhook.service';

@Module({
  imports: [PaymentModule, RecoveryModule],
  controllers: [RazorpayWebhookController],
  providers: [RazorpayWebhookService],
})
export class RazorpayWebhookModule {}
