import { Injectable } from '@nestjs/common';
import { RecoveryCaseStatus, RecoveryPriority } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RecoveryEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateFromFailedPayment(merchantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, merchantId },
      include: { customer: true },
    });
    if (!payment) return null;

    const amount = Number(payment.amount);
    let probability = 0.55;
    if (payment.customer?.email) probability += 0.05;
    if (payment.customer?.phone) probability += 0.10;
    if (payment.failureCategory === 'NETWORK') probability += 0.10;
    if (payment.failureCategory === 'INSUFFICIENT_FUNDS') probability += 0.05;
    if (amount <= 5000) probability += 0.05;
    probability = Math.min(probability, 0.90);

    const priority = amount >= 10000 || probability >= 0.70
      ? RecoveryPriority.HIGH
      : RecoveryPriority.MEDIUM;
    const expectedRecovery = amount * probability;

    const existing = await this.prisma.recoveryCase.findFirst({
      where: { merchantId, paymentId },
    });

    if (existing) {
      return this.prisma.recoveryCase.update({
        where: { id: existing.id },
        data: {
          revenueAtRisk: amount,
          recoveryProbability: probability,
          expectedRecovery,
          priority,
          failureCategory: payment.failureCategory,
          status: existing.status === RecoveryCaseStatus.RECOVERED
            ? existing.status
            : RecoveryCaseStatus.OPEN,
        },
      });
    }

    return this.prisma.recoveryCase.create({
      data: {
        merchantId,
        customerId: payment.customerId,
        paymentId,
        status: RecoveryCaseStatus.OPEN,
        priority,
        failureCategory: payment.failureCategory,
        revenueAtRisk: amount,
        recoveryProbability: probability,
        expectedRecovery,
        attemptCount: 0,
        aiSummary: 'Deterministic recovery score. AI policy agent will replace this in Phase 3.',
      },
    });
  }

  async markRecovered(merchantId: string, paymentId: string) {
    const recoveryCase = await this.prisma.recoveryCase.findFirst({
      where: { merchantId, paymentId },
    });
    if (!recoveryCase) return null;

    return this.prisma.recoveryCase.update({
      where: { id: recoveryCase.id },
      data: {
        status: RecoveryCaseStatus.RECOVERED,
        recoveredAt: new Date(),
        nextActionAt: null,
      },
    });
  }
}
