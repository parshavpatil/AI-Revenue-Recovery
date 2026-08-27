import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaymentService } from '../../payment/payment.service';
import { RecoveryEngineService } from '../../recovery/recovery-engine.service';

@Injectable()
export class RazorpayWebhookService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly payments: PaymentService,
    private readonly recovery: RecoveryEngineService,
  ) {}

  async handle(
    merchantId: string,
    rawBody: Buffer,
    signature?: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException(
        'Missing Razorpay signature.',
      );
    }

    const secret = this.config.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );

    if (!secret) {
      throw new BadRequestException(
        'RAZORPAY_WEBHOOK_SECRET is not configured.',
      );
    }

    // ---------------------------------------------------------
    // 1. Verify Razorpay webhook signature
    // ---------------------------------------------------------

    const expectedSignature = createHmac(
      'sha256',
      secret,
    )
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(
      expectedSignature,
      'utf8',
    );

    const receivedBuffer = Buffer.from(
      signature,
      'utf8',
    );

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(
        expectedBuffer,
        receivedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid Razorpay signature.',
      );
    }

    // ---------------------------------------------------------
    // 2. Parse webhook payload
    // ---------------------------------------------------------

    let payload: Record<string, any>;

    try {
      payload = JSON.parse(
        rawBody.toString('utf8'),
      );
    } catch {
      throw new BadRequestException(
        'Invalid webhook JSON.',
      );
    }

    const event = String(
      payload.event ?? '',
    );

    if (!event) {
      throw new BadRequestException(
        'Webhook event is missing.',
      );
    }

    // ---------------------------------------------------------
    // 3. Extract payment entity
    // ---------------------------------------------------------

    const entity =
      payload.payload?.payment?.entity ??
      payload.payload?.payment ??
      null;

    // ---------------------------------------------------------
    // 4. Store webhook event
    //
    // PaymentEvent in your current Prisma schema only accepts
    // the fields defined there. We therefore only store the
    // webhook payload and event information that your existing
    // schema supports.
    // ---------------------------------------------------------

    await this.prisma.paymentEvent.create({
      data: {
        eventType: event,
        payload,
      },
    });

    if (!entity) {
      return {
        accepted: true,
        event,
        processed: false,
        reason: 'payment-entity-not-found',
      };
    }

    // ---------------------------------------------------------
    // 5. payment.failed
    // ---------------------------------------------------------

    if (event === 'payment.failed') {
      const payment =
        await this.payments.upsertFailedPayment(
          merchantId,
          entity,
        );

      if (!payment) {
        return {
          accepted: true,
          event,
          processed: false,
          reason: 'payment-not-linked',
        };
      }

      const recoveryCase =
        await this.recovery.createOrUpdateFromFailedPayment(
          merchantId,
          payment.id,
        );

      return {
        accepted: true,
        event,
        processed: true,
        paymentId: payment.id,
        recoveryCaseId:
          recoveryCase?.id ?? null,
      };
    }

    // ---------------------------------------------------------
    // 6. payment.captured
    // ---------------------------------------------------------

    if (event === 'payment.captured') {
      const payment =
        await this.payments.markCaptured(
          merchantId,
          entity,
        );

      if (!payment) {
        return {
          accepted: true,
          event,
          processed: false,
          reason: 'payment-not-found',
        };
      }

      const recoveryCase =
        await this.recovery.markRecovered(
          merchantId,
          payment.id,
        );

      return {
        accepted: true,
        event,
        processed: true,
        paymentId: payment.id,
        recoveryCaseId:
          recoveryCase?.id ?? null,
      };
    }

    // ---------------------------------------------------------
    // 7. Other events
    // ---------------------------------------------------------

    return {
      accepted: true,
      event,
      processed: false,
    };
  }
}