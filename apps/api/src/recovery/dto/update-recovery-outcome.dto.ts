import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateRecoveryOutcomeDto {
  @IsIn([
    'RECOVERED',
    'PROMISED_TO_PAY',
    'NO_RESPONSE',
    'FAILED',
  ])
  outcome!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}