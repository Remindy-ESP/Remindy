import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class UpdateSharedSubscriptionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsIn(['active', 'paused', 'cancelled', 'trial']) status?: string;
  @IsOptional() @IsString() notes?: string;
}
