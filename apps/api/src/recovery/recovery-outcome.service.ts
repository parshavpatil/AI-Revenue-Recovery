import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RecoveryOutcomeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async updateOutcome(
    merchantId: string,
    recoveryCaseId: string,
    outcome: string,
    reason?: string,
  ) {
    // ---------------------------------------------
    // 1. Find recovery case
    // ---------------------------------------------

    const recoveryCase =
      await this.prisma.recoveryCase.findFirst({
        where: {
          id: recoveryCaseId,
          merchantId,
        },
      });

    if (!recoveryCase) {
      throw new NotFoundException(
        'Recovery case not found.',
      );
    }

    // ---------------------------------------------
    // 2. RECOVERED
    // ---------------------------------------------

    if (outcome === 'RECOVERED') {
      const now = new Date();

      const updated =
        await this.prisma.recoveryCase.update({
          where: {
            id: recoveryCaseId,
          },
          data: {
            status: 'RECOVERED',
            recoveredAt: now,
            nextActionAt: null,
            stoppedAt: null,
            stopReason: null,
          },
        });

      // Mark payment as successful if linked
      if (recoveryCase.paymentId) {
        await this.prisma.payment.update({
          where: {
            id: recoveryCase.paymentId,
          },
          data: {
            status: 'CAPTURED',
            capturedAt: now,
          },
        });
      }

      return {
        success: true,
        outcome: 'RECOVERED',
        message:
          'Payment recovery confirmed.',
        recoveryCase: updated,
      };
    }

    // ---------------------------------------------
    // 3. PROMISED TO PAY
    // ---------------------------------------------

    if (outcome === 'PROMISED_TO_PAY') {
      const nextActionAt = new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      );

      const updated =
        await this.prisma.recoveryCase.update({
          where: {
            id: recoveryCaseId,
          },
          data: {
            status: 'OPEN',
            nextActionAt,
            stoppedAt: null,
            stopReason: null,
          },
        });

      return {
        success: true,
        outcome: 'PROMISED_TO_PAY',
        message:
          'Customer promised to retry payment.',
        nextActionAt,
        recoveryCase: updated,
      };
    }

    // ---------------------------------------------
    // 4. NO RESPONSE
    // ---------------------------------------------

    if (outcome === 'NO_RESPONSE') {
      const nextActionAt = new Date(
        Date.now() +
          24 * 60 * 60 * 1000,
      );

      const updated =
        await this.prisma.recoveryCase.update({
          where: {
            id: recoveryCaseId,
          },
          data: {
            status: 'OPEN',
            nextActionAt,
          },
        });

      return {
        success: true,
        outcome: 'NO_RESPONSE',
        message:
          'No customer response. Case remains open for another attempt.',
        nextActionAt,
        recoveryCase: updated,
      };
    }

    // ---------------------------------------------
    // 5. FAILED
    // ---------------------------------------------

    if (outcome === 'FAILED') {
      const updated =
        await this.prisma.recoveryCase.update({
          where: {
            id: recoveryCaseId,
          },
          data: {
            status: 'STOPPED',
            stoppedAt: new Date(),
            nextActionAt: null,
            stopReason:
              reason ||
              'Recovery attempt failed.',
          },
        });

      return {
        success: true,
        outcome: 'FAILED',
        message:
          'Recovery case stopped.',
        recoveryCase: updated,
      };
    }

    throw new BadRequestException(
      'Unsupported recovery outcome.',
    );
  }
}