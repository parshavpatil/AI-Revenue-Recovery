import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreatePaymentLinkDto {
  @IsString()
  recoveryCaseId!: string;

  @IsInt()
  @Min(100)
  @Max(100000000)
  amountPaise!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerContact?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsInt()
  expireByUnix?: number;

  @IsOptional()
  @IsUrl()
  callbackUrl?: string;
}
