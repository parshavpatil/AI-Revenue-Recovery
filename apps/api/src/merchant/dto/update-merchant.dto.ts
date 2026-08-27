import { IsEnum, IsOptional, IsString, IsTimeZone } from 'class-validator'; import { MerchantStatus } from '@prisma/client';
export class UpdateMerchantDto { @IsOptional() @IsString() name?:string; @IsOptional() @IsTimeZone() timezone?:string; @IsOptional() @IsEnum(MerchantStatus) status?:MerchantStatus; }
