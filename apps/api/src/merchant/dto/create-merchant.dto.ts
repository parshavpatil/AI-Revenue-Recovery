import { IsOptional, IsString, IsTimeZone } from 'class-validator';
export class CreateMerchantDto { @IsString() name!:string; @IsOptional() @IsString() razorpayAccountId?:string; @IsOptional() @IsTimeZone() timezone?:string; }
