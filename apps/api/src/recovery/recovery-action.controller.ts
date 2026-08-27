import {
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { RecoveryActionService } from './recovery-action.service';

@Controller(
  'merchants/:merchantId/recovery-cases',
)
export class RecoveryActionController {
  constructor(
    private readonly actions: RecoveryActionService,
  ) {}

  @Post(':recoveryCaseId/execute')
  async execute(
    @Param('merchantId') merchantId: string,
    @Param('recoveryCaseId') recoveryCaseId: string,
  ) {
    return this.actions.execute(
      merchantId,
      recoveryCaseId,
    );
  }
}