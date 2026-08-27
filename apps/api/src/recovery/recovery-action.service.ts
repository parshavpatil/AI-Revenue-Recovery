import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RecoveryActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly ai: AiService,
  ) {}

  async execute(
    merchantId: string,
    recoveryCaseId: string,
  ) {
    const recoveryCase =
      await this.prisma.recoveryCase.findFirst({
        where: {
          id: recoveryCaseId,
          merchantId,
        },
        include: {
          customer: true,
          payment: true,
        },
      });

    if (!recoveryCase) {
      throw new NotFoundException(
        'Recovery case not found.',
      );
    }

    if (!recoveryCase.customer) {
      throw new NotFoundException(
        'Customer not found.',
      );
    }

    if (!recoveryCase.payment) {
      throw new NotFoundException(
        'Payment not found.',
      );
    }

    if (recoveryCase.customer.doNotContact) {
      throw new BadRequestException(
        'Customer has opted out of communication.',
      );
    }

    // Ask AI what action should be taken.
    const strategy =
      await this.ai.generateRecoveryStrategy(
        merchantId,
        recoveryCaseId,
      );

    if (strategy.strategy === 'NONE') {
      return {
        executed: false,
        reason: strategy.reason,
        strategy,
      };
    }

    // --------------------------------------------------
    // PAYMENT LINK
    // --------------------------------------------------

    if (
      strategy.strategy === 'PAYMENT_LINK'
    ) {
      const paymentLink =
        await this.razorpay.createPaymentLink(
          merchantId,
          {
            recoveryCaseId,
            amountPaise: Math.round(
              Number(recoveryCase.payment.amount) *
                100,
            ),
            description:
              `RecoverAI recovery payment - ${recoveryCase.payment.currency}`,
            customerName:
              recoveryCase.customer.name,
            customerEmail:
              recoveryCase.customer.email ??
              undefined,
            customerContact:
              recoveryCase.customer.phone ??
              undefined,
          },
        );

      // Replace the placeholder URL in AI message
      // with the actual Razorpay URL.
      const message =
        strategy.message.replace(
          /https?:\/\/\S+/,
          paymentLink.shortUrl,
        );

      return {
        executed: true,
        strategy: strategy.strategy,
        channel: strategy.channel,
        paymentLink: {
          id: paymentLink.id,
          shortUrl: paymentLink.shortUrl,
        },
        message,
      };
    }

    // --------------------------------------------------
    // SMS
    // --------------------------------------------------

    if (strategy.channel === 'SMS') {
      if (!recoveryCase.customer.smsOptIn) {
        return {
          executed: false,
          reason:
            'Customer has not opted into SMS.',
          strategy,
        };
      }

      return {
        executed: true,
        strategy: strategy.strategy,
        channel: 'SMS',
        simulated: true,
        message: strategy.message,
      };
    }

    return {
      executed: false,
      reason:
        'Action execution for this strategy is not implemented yet.',
      strategy,
    };
  }
}