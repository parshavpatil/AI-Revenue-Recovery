import {
  Body,
  Controller,
  Param,
  Patch,
} from '@nestjs/common';

import { RecoveryOutcomeService } from './recovery-outcome.service';
import { UpdateRecoveryOutcomeDto } from './dto/update-recovery-outcome.dto';

@Controller('merchants/:merchantId/recovery-cases')
export class RecoveryOutcomeController {
  constructor(
    private readonly recoveryOutcomeService: RecoveryOutcomeService,
  ) {}

  @Patch(':recoveryCaseId/outcome')
  updateOutcome(
    @Param('merchantId') merchantId: string,
    @Param('recoveryCaseId') recoveryCaseId: string,
    @Body() dto: UpdateRecoveryOutcomeDto,
  ) {
    return this.recoveryOutcomeService.updateOutcome(
      merchantId,
      recoveryCaseId,
      dto.outcome,
    );
  }
}