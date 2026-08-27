import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class VoiceRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    merchantId: string,
    recoveryCaseId: string,
  ) {
    // --------------------------------------------------
    // 1. Load recovery case
    // --------------------------------------------------

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
      throw new BadRequestException(
        'Recovery case not found.',
      );
    }

    const customer = recoveryCase.customer;
    const payment = recoveryCase.payment;

    if (!customer) {
      throw new BadRequestException(
        'Recovery case has no customer.',
      );
    }

    if (!payment) {
      throw new BadRequestException(
        'Recovery case has no payment.',
      );
    }

    // --------------------------------------------------
    // 2. Do-not-contact protection
    // --------------------------------------------------

    if (customer.doNotContact) {
      return {
        executed: false,
        blocked: true,
        reason: 'CUSTOMER_DO_NOT_CONTACT',
        message:
          'Voice recovery blocked because customer has opted out of contact.',
      };
    }

    // --------------------------------------------------
    // 3. Voice consent protection
    // --------------------------------------------------

    if (!customer.voiceOptIn) {
      return {
        executed: false,
        blocked: true,
        reason: 'VOICE_OPT_IN_REQUIRED',
        message:
          'Voice recovery blocked because customer has not opted in to voice calls.',
      };
    }

    // --------------------------------------------------
    // 4. Calling hours
    // --------------------------------------------------

    const now = new Date();

    const callingStartHour = 9;
    const callingEndHour = 20;

    const currentHour = now.getHours();

    if (
      currentHour < callingStartHour ||
      currentHour >= callingEndHour
    ) {
      return {
        executed: false,
        blocked: true,
        reason: 'OUTSIDE_CALLING_HOURS',
        message:
          `Voice recovery is only allowed between ${callingStartHour}:00 and ${callingEndHour}:00.`,
      };
    }

    // --------------------------------------------------
    // 5. Check for an existing active call
    // --------------------------------------------------

    const existingCall =
      await this.prisma.voiceCall.findFirst({
        where: {
          recoveryCaseId,
          status: {
            in: [
              'QUEUED',
              'RINGING',
              'IN_PROGRESS',
            ],
          },
        },
      });

    // --------------------------------------------------
    // 6. Resume stuck simulated call
    // --------------------------------------------------

    if (existingCall) {
      const endedAt = new Date();

      await this.prisma.voiceCall.update({
        where: {
          id: existingCall.id,
        },
        data: {
          status: 'COMPLETED',
          outcome: 'PAYMENT_INTENT',
          durationSeconds: 20,
          endedAt,
          summary:
            'Customer expressed intent to retry the failed payment.',
          sentiment: 'POSITIVE',
          confidence: 0.92,
        },
      });

      await this.prisma.recoveryCase.update({
        where: {
          id: recoveryCaseId,
        },
        data: {
          attemptCount: {
            increment: 1,
          },
          lastAttemptAt: endedAt,
        },
      });

      return {
        executed: true,
        resumed: true,
        simulated: true,
        voiceCallId: existingCall.id,
        outcome: 'PAYMENT_INTENT',
        durationSeconds: 20,
        summary:
          'Customer expressed intent to retry the failed payment.',
      };
    }

    // --------------------------------------------------
    // 7. Create a new simulated voice call
    // --------------------------------------------------

    const voiceCall =
      await this.prisma.voiceCall.create({
        data: {
          recoveryCaseId,
          customerId: customer.id,
          provider: 'SIMULATED',
          providerCallId:
            `demo_call_${Date.now()}`,
          phoneNumber: customer.phone,
          language:
            customer.preferredLanguage ||
            'hinglish',
          status: 'QUEUED',
        },
      });

    // --------------------------------------------------
    // 8. Ringing
    // --------------------------------------------------

    await this.prisma.voiceCall.update({
      where: {
        id: voiceCall.id,
      },
      data: {
        status: 'RINGING',
      },
    });

    // --------------------------------------------------
    // 9. Generate deterministic demo conversation
    // --------------------------------------------------

    const conversation =
      this.generateConversation(
        customer.name,
        payment.amount.toString(),
        payment.currency,
      );

    // --------------------------------------------------
    // 10. Start call
    // --------------------------------------------------

    const startedAt = new Date();

    await this.prisma.voiceCall.update({
      where: {
        id: voiceCall.id,
      },
      data: {
        status: 'IN_PROGRESS',
        startedAt,
      },
    });

    // --------------------------------------------------
    // 11. Store transcript
    // --------------------------------------------------

    for (
      let index = 0;
      index < conversation.length;
      index++
    ) {
      const turn = conversation[index];

      await this.prisma.voiceTranscript.create({
        data: {
          voiceCallId: voiceCall.id,
          sequence: index + 1,
          speaker: turn.speaker,
          text: turn.text,
          language: 'hinglish',
          intent: turn.intent,
          confidence: turn.confidence,
        },
      });
    }

    // --------------------------------------------------
    // 12. Determine outcome
    // --------------------------------------------------

    const customerHasPaymentIntent =
      conversation.some(
        (turn) =>
          turn.intent === 'PAYMENT_INTENT',
      );

    const outcome = customerHasPaymentIntent
      ? 'PAYMENT_INTENT'
      : 'OTHER';

    const endedAt = new Date();

    const durationSeconds = Math.max(
      20,
      Math.round(
        (endedAt.getTime() -
          startedAt.getTime()) /
          1000,
      ),
    );

    const summary =
      customerHasPaymentIntent
        ? 'Customer expressed intent to retry the failed payment.'
        : 'Customer did not express a clear payment intent.';

    // --------------------------------------------------
    // 13. Complete voice call
    // --------------------------------------------------

    await this.prisma.voiceCall.update({
      where: {
        id: voiceCall.id,
      },
      data: {
        status: 'COMPLETED',
        outcome,
        durationSeconds,
        endedAt,
        summary,
        sentiment: customerHasPaymentIntent
          ? 'POSITIVE'
          : 'NEUTRAL',
        confidence: 0.92,
      },
    });

    // --------------------------------------------------
    // 14. Update recovery case
    // --------------------------------------------------

    await this.prisma.recoveryCase.update({
      where: {
        id: recoveryCaseId,
      },
      data: {
        attemptCount: {
          increment: 1,
        },
        lastAttemptAt: endedAt,
      },
    });

    // --------------------------------------------------
    // 15. Return result
    // --------------------------------------------------

    return {
      executed: true,
      simulated: true,
      voiceCallId: voiceCall.id,
      phoneNumber: customer.phone,
      language:
        customer.preferredLanguage ||
        'hinglish',
      outcome,
      durationSeconds,
      summary,
      transcript: conversation,
    };
  }

  // ==================================================
  // SIMULATED HINGLISH CONVERSATION
  // ==================================================

  private generateConversation(
    customerName: string,
    amount: string,
    currency: string,
  ) {
    return [
      {
        speaker: 'AGENT',
        text:
          `Namaste ${customerName} ji, RecoverAI se call kar rahe hain. Aapka ${amount} ${currency} ka payment bank ki wajah se decline ho gaya tha.`,
        intent:
          'PAYMENT_FAILURE_EXPLANATION',
        confidence: 0.95,
      },

      {
        speaker: 'CUSTOMER',
        text:
          'Achha, samajh gaya. Payment dobara kaise karna hai?',
        intent:
          'PAYMENT_INTENT',
        confidence: 0.94,
      },

      {
        speaker: 'AGENT',
        text:
          'Aapko ek secure payment link diya jayega. Aap usse payment dobara safely try kar sakte hain.',
        intent:
          'PAYMENT_LINK_REQUESTED',
        confidence: 0.96,
      },

      {
        speaker: 'CUSTOMER',
        text:
          'Theek hai, main payment dobara try karunga.',
        intent:
          'PAYMENT_INTENT',
        confidence: 0.97,
      },

      {
        speaker: 'AGENT',
        text:
          'Bahut badhiya ji. Aapko payment link message mein mil jayega. Dhanyavaad!',
        intent:
          'CALL_CLOSING',
        confidence: 0.98,
      },
    ];
  }
}