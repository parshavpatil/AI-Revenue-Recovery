import {
  Controller,
  Param,
  Post,
} from '@nestjs/common';

import { VoiceRecoveryService } from './voice-recovery.service';

@Controller(
  'merchants/:merchantId/recovery-cases',
)
export class VoiceRecoveryController {
  constructor(
    private readonly voiceRecovery:
      VoiceRecoveryService,
  ) {}

  @Post(':recoveryCaseId/voice')
  executeVoiceRecovery(
    @Param('merchantId')
    merchantId: string,

    @Param('recoveryCaseId')
    recoveryCaseId: string,
  ) {
    return this.voiceRecovery.execute(
      merchantId,
      recoveryCaseId,
    );
  }
}