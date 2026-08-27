import {
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('merchants/:merchantId/ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
  ) {}

  @Post('recovery-cases/:recoveryCaseId/analyze')
  async analyze(
    @Param('merchantId') merchantId: string,
    @Param('recoveryCaseId') recoveryCaseId: string,
  ) {
    return this.ai.generateRecoveryStrategy(
      merchantId,
      recoveryCaseId,
    );
  }
}