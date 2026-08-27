import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ListRecoveryCasesDto } from './dto/list-recovery-cases.dto';

@Injectable()
export class RecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(merchantId: string, query: ListRecoveryCasesDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found.');
    }

    return this.prisma.recoveryCase.findMany({
      where: {
        merchantId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
      },

      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            preferredLanguage: true,
            voiceOptIn: true,
            smsOptIn: true,
            doNotContact: true,
          },
        },

        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            method: true,
            failureCategory: true,
            failureReason: true,
          },
        },

        actions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },

        voiceCalls: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            transcripts: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },

        promises: {
          orderBy: {
            createdAt: 'desc',
          },
        },

        auditLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async findOne(merchantId: string, id: string) {
    const recoveryCase = await this.prisma.recoveryCase.findFirst({
      where: {
        id,
        merchantId,
      },

      include: {
        customer: true,

        payment: {
          include: {
            events: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
            },
          },
        },

        actions: {
          orderBy: {
            createdAt: 'asc',
          },
        },

        voiceCalls: {
          include: {
            transcripts: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },

        promises: {
          orderBy: {
            createdAt: 'desc',
          },
        },

        auditLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!recoveryCase) {
      throw new NotFoundException('Recovery case not found.');
    }

    return recoveryCase;
  }
}