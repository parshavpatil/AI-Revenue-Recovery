import { Injectable } from '@nestjs/common';
import { PaymentFailureCategory, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRazorpayId(
    merchantId: string,
    razorpayPaymentId: string,
  ) {
    return this.prisma.payment.findFirst({
      where: {
        merchantId,
        razorpayPaymentId,
      },
    });
  }

  async upsertFailedPayment(
    merchantId: string,
    entity: Record<string, any>,
  ) {
    const razorpayPaymentId = String(entity.id ?? '');

    if (!razorpayPaymentId) {
      return null;
    }

    const amount = Number(entity.amount ?? 0) / 100;

    const existing = await this.findByRazorpayId(
      merchantId,
      razorpayPaymentId,
    );

    const failureCategory =
      this.mapFailureCategory(
        entity.error?.reason,
        entity.error?.code,
        entity.error?.description,
      );

    if (existing) {
      return this.prisma.payment.update({
        where: {
          id: existing.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          amount,
          failureCategory,
          failureReason:
            entity.error?.description ??
            entity.error_description ??
            existing.failureReason,
          failureCode:
            entity.error?.code ??
            entity.error_code ??
            existing.failureCode,
          method: entity.method ?? existing.method,
          razorpayOrderId:
            entity.order_id ??
            existing.razorpayOrderId,
        },
      });
    }

    const customerId = entity.notes?.customer_id as
      | string
      | undefined;

    if (!customerId) {
      return null;
    }

    return this.prisma.payment.create({
      data: {
        merchantId,
        customerId,
        razorpayPaymentId,
        razorpayOrderId: entity.order_id,
        amount,
        currency: entity.currency ?? 'INR',
        status: PaymentStatus.FAILED,
        method: entity.method,
        failureCategory,
        failureReason:
          entity.error?.description ??
          entity.error_description,
        failureCode:
          entity.error?.code ??
          entity.error_code,
      },
    });
  }

  async markCaptured(
    merchantId: string,
    entity: Record<string, any>,
  ) {
    const razorpayPaymentId = String(entity.id ?? '');

    if (!razorpayPaymentId) {
      return null;
    }

    const payment = await this.findByRazorpayId(
      merchantId,
      razorpayPaymentId,
    );

    if (!payment) {
      return null;
    }

    return this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.CAPTURED,
        capturedAt: new Date(),
      },
    });
  }

  private mapFailureCategory(
    reason?: string,
    code?: string,
    description?: string,
  ): PaymentFailureCategory {
    const text =
      `${reason ?? ''} ${code ?? ''} ${description ?? ''}`
        .toLowerCase();

    if (
      text.includes('network') ||
      text.includes('gateway')
    ) {
      return PaymentFailureCategory.NETWORK;
    }

    if (
      text.includes('insufficient') ||
      text.includes('balance') ||
      text.includes('fund')
    ) {
      return PaymentFailureCategory.INSUFFICIENT_FUNDS;
    }

    if (text.includes('expired')) {
      return PaymentFailureCategory.EXPIRED;
    }

    if (
      text.includes('declin') ||
      text.includes('issuer') ||
      text.includes('bank')
    ) {
      return PaymentFailureCategory.BANK_DECLINED;
    }

    if (
      text.includes('authentication') ||
      text.includes('auth')
    ) {
      return PaymentFailureCategory.AUTHENTICATION;
    }

    if (
      text.includes('invalid') ||
      text.includes('detail')
    ) {
      return PaymentFailureCategory.INVALID_DETAILS;
    }

    if (text.includes('fraud')) {
      return PaymentFailureCategory.FRAUD_SUSPECTED;
    }

    if (
      text.includes('limit') ||
      text.includes('exceed')
    ) {
      return PaymentFailureCategory.LIMIT_EXCEEDED;
    }

    return PaymentFailureCategory.UNKNOWN;
  }
}