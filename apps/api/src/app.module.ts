import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { AiModule } from './ai/ai.module';
import { DevModule } from './dev/dev.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { MerchantModule } from './merchant/merchant.module';
import { CustomerModule } from './customer/customer.module';
import { RecoveryModule } from './recovery/recovery.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { PaymentModule } from './payment/payment.module';
import { RazorpayWebhookModule } from './webhooks/razorpay/razorpay-webhook.module';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        join(process.cwd(), '../../.env'),
        join(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    HealthModule,
    MerchantModule,
    CustomerModule,
    PaymentModule,
    RecoveryModule,
    RazorpayModule,
    RazorpayWebhookModule,
    DevModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
