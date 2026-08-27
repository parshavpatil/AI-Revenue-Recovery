import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import Razorpay from 'razorpay';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { RazorpayPaymentLinkResponse } from './types';

@Injectable()
export class RazorpayService {
  private readonly client: Razorpay;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.warn(
        'Razorpay credentials are not configured. Razorpay API calls will fail until .env is configured.',
      );
    }

    this.client = new Razorpay({
      key_id: keyId ?? 'missing-key-id',
      key_secret: keySecret ?? 'missing-key-secret',
    });
  }

  async createPaymentLink(
    merchantId: string,
    dto: CreatePaymentLinkDto,
  ) {
    const recoveryCase = await this.prisma.recoveryCase.findFirst({
      where: {
        id: dto.recoveryCaseId,
        merchantId,
      },
      include: {
        customer: true,
        payment: true,
      },
    });

    if (!recoveryCase) {
      throw new NotFoundException('Recovery case not found.');
    }

    if (recoveryCase.status === 'RECOVERED') {
      throw new BadRequestException(
        'Payment link cannot be created for an already recovered case.',
      );
    }

    const referenceId =
      dto.referenceId ??
      `RC-${recoveryCase.id}-${Date.now()}`.slice(0, 40);

    const existing = await this.prisma.paymentLink.findUnique({
      where: { referenceId },
    });

    if (existing) {
      return existing;
    }

    try {
      const response =
        (await this.client.paymentLink.create({
          amount: dto.amountPaise,
          currency: dto.currency ?? 'INR',
          accept_partial: false,
          reference_id: referenceId,
          description:
            dto.description ??
            `Payment recovery for case ${recoveryCase.id}`,

          customer: {
            name: dto.customerName ?? recoveryCase.customer?.name,
            contact:
              dto.customerContact ??
              recoveryCase.customer?.phone ??
              undefined,
            email:
              dto.customerEmail ??
              recoveryCase.customer?.email ??
              undefined,
          },

          expire_by: dto.expireByUnix,
          callback_url: dto.callbackUrl,
          callback_method: dto.callbackUrl ? 'get' : undefined,
          reminder_enable: false,

          notes: {
            recovery_case_id: recoveryCase.id,
            merchant_id: merchantId,
          },
        })) as unknown as RazorpayPaymentLinkResponse;

      const paymentLink = await this.prisma.paymentLink.create({
        data: {
          merchantId,
          recoveryCaseId: recoveryCase.id,
          customerId: recoveryCase.customerId,
          razorpayPaymentLinkId: response.id,
          referenceId,
          shortUrl: response.short_url,
          amount: response.amount / 100,
          currency: response.currency,
          status: response.status,
          expireBy: response.expire_by
            ? new Date(response.expire_by * 1000)
            : null,
        },
      });

      await this.prisma.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          type: 'CREATE_PAYMENT_LINK',
          status: 'SUCCEEDED',
          policyDecision: 'ALLOW',
          aiReason:
            'Payment link created through the Razorpay integration.',
          output: {
            razorpayPaymentLinkId: response.id,
            shortUrl: response.short_url,
            referenceId,
          },
          completedAt: new Date(),
          idempotencyKey: `payment-link:${response.id}`,
        },
      });

      return paymentLink;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown Razorpay error';

      throw new InternalServerErrorException(
        `Razorpay Payment Link creation failed: ${message}`,
      );
    }
  }

  async fetchPayment(paymentId: string) {
    return this.client.payments.fetch(paymentId);
  }
}