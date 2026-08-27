import { Module } from '@nestjs/common';

import { RecoveryOutcomeController } from './recovery-outcome.controller';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { RecoveryEngineService } from './recovery-engine.service';

import { VoiceRecoveryController } from './voice-recovery.controller';
import { RecoveryActionController } from './recovery-action.controller';
import { RecoveryActionService } from './recovery-action.service';
import { VoiceRecoveryService } from './voice-recovery.service';
import { RazorpayModule } from '../razorpay/razorpay.module';
import { AiModule } from '../ai/ai.module';

import { RecoveryOutcomeService } from './recovery-outcome.service';

@Module({
  imports: [
    RazorpayModule,
    AiModule,
  ],
  controllers: [
  RecoveryController,
  RecoveryActionController,
  VoiceRecoveryController,
  RecoveryOutcomeController,
],

  providers: [
    RecoveryService,
    RecoveryEngineService,
    RecoveryActionService,
    VoiceRecoveryService,
    RecoveryOutcomeService,
  ],
  exports: [
    RecoveryEngineService,
    RecoveryActionService,
    VoiceRecoveryService,
  ],
})
export class RecoveryModule {}