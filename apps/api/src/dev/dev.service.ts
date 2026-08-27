import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DevService {
  constructor(private readonly prisma: PrismaService) {}

  async simulatePaymentFailure(
    merchantId: string,
    customerId: string,
    amountPaise: number,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        merchantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const amount = amountPaise / 100;

    const payment = await this.prisma.payment.create({
      data: {
        merchantId,
        customerId,
        razorpayPaymentId: `pay_demo_${Date.now()}`,
        amount,
        currency: 'INR',
        status: 'FAILED',
        method: 'CARD',
        failureCategory: 'BANK_DECLINED',
        failureCode: 'BAD_REQUEST_ERROR',
        failureReason: 'The payment was declined by the bank.',
        failedAt: new Date(),
      },
    });

    const recoveryProbability = 0.70;
    const expectedRecovery = amount * recoveryProbability;

    const recoveryCase = await this.prisma.recoveryCase.create({
      data: {
        merchantId,
        customerId,
        paymentId: payment.id,
        status: 'OPEN',
        priority: amount >= 10000 ? 'HIGH' : 'MEDIUM',
        failureCategory: 'BANK_DECLINED',
        revenueAtRisk: amount,
        recoveryProbability,
        expectedRecovery,
        attemptCount: 0,
        aiSummary:
          'Demo failed payment. Customer payment was declined by the bank.',
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        razorpayEventId: `evt_demo_${Date.now()}`,
        eventType: 'payment.failed',
        payload: {
          demo: true,
          payment: {
            id: payment.razorpayPaymentId,
            amount: amountPaise,
            currency: 'INR',
            status: 'failed',
            method: 'card',
            error: {
              code: 'BAD_REQUEST_ERROR',
              reason: 'payment_failed',
              description:
                'The payment was declined by the bank.',
            },
          },
        },
        occurredAt: new Date(),
        processedAt: new Date(),
        processingStatus: 'PROCESSED',
      },
    });

    await this.prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        failedPayments: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message: 'Demo payment failure created.',
      payment,
      recoveryCase,
    };
  }
}