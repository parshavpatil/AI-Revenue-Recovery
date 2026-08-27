import { IsEnum, IsOptional } from 'class-validator'; import { RecoveryCaseStatus, RecoveryPriority } from '@prisma/client';
export class ListRecoveryCasesDto { @IsOptional() @IsEnum(RecoveryCaseStatus) status?:RecoveryCaseStatus; @IsOptional() @IsEnum(RecoveryPriority) priority?:RecoveryPriority; }
