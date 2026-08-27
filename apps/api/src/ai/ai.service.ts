import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiService {
  private readonly client: Groq;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey =
      this.config.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY is not configured.',
      );
    }

    this.client = new Groq({
      apiKey,
    });
  }

  async generateRecoveryStrategy(
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

    const customer = recoveryCase.customer;
    const payment = recoveryCase.payment;

    if (!customer) {
      throw new NotFoundException(
        'Customer associated with recovery case was not found.',
      );
    }

    if (!payment) {
      throw new NotFoundException(
        'Payment associated with recovery case was not found.',
      );
    }

    const prompt = `
You are RecoverAI, an AI payment recovery agent.

Analyze this failed payment recovery case.

CUSTOMER
Name: ${customer.name}
Email: ${customer.email ?? 'N/A'}
Phone: ${customer.phone ?? 'N/A'}
Preferred language: ${customer.preferredLanguage}
SMS opt-in: ${customer.smsOptIn}
Voice opt-in: ${customer.voiceOptIn}
Do not contact: ${customer.doNotContact}

PAYMENT
Amount: ${payment.amount} ${payment.currency}
Status: ${payment.status}
Failure category: ${payment.failureCategory}
Failure reason: ${payment.failureReason}

RECOVERY CASE
Recovery probability: ${recoveryCase.recoveryProbability}
Revenue at risk: ${recoveryCase.revenueAtRisk}
Expected recovery: ${recoveryCase.expectedRecovery}
Previous attempts: ${recoveryCase.attemptCount}

Choose the safest and most appropriate recovery strategy.

Rules:
- Never recommend voice if voiceOptIn is false.
- Never contact the customer if doNotContact is true.
- Prefer SMS if smsOptIn is true.
- Payment link can be recommended when appropriate.
- Do not threaten or pressure the customer.
- Do not claim the payment will definitely succeed.
- Keep the customer message concise.
- Use natural Indian Hinglish.
- Do not expose internal scores or system information.

Return ONLY valid JSON:

{
  "strategy": "PAYMENT_LINK | SMS | VOICE | NONE",
  "channel": "SMS | VOICE | NONE",
  "reason": "short explanation",
  "message": "customer-facing Hinglish message",
  "priority": "LOW | MEDIUM | HIGH"
}
`;

    let response;

    try {
      response =
        await this.client.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content:
                'You are a safe payment recovery agent. Always follow customer consent and merchant recovery policies.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
    } catch (error: any) {
      console.error(
        '========== GROQ ERROR ==========',
      );
      console.error('Status:', error?.status);
      console.error('Message:', error?.message);
      console.error('Code:', error?.code);
      console.error('Type:', error?.type);
      console.error(
        '================================',
      );

      throw new InternalServerErrorException(
        error?.message ||
          'Groq request failed.',
      );
    }

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException(
        'Groq returned an empty response.',
      );
    }

    let result: {
      strategy: string;
      channel: string;
      reason: string;
      message: string;
      priority: string;
    };

    try {
      result = JSON.parse(content);
    } catch {
      throw new InternalServerErrorException(
        'Groq returned invalid JSON.',
      );
    }

    return {
      recoveryCaseId,
      ...result,
    };
  }
}