import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export type BudgetPeriodInput = 'monthly' | 'yearly';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Budget name',
    example: 'Monthly streaming',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Budget amount (positive decimal, 2 decimals)',
    example: 50,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({
    description: 'Budget period',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  period: BudgetPeriodInput;

  @ApiProperty({
    description: 'Date the budget window starts',
    example: '2026-01-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Optional explicit end date. If omitted it is derived from period.',
    required: false,
    nullable: true,
    example: '2026-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Optional category ID to scope the budget',
    required: false,
    nullable: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Explicit list of subscription IDs linked to this budget',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  subscriptionIds?: string[];

  @ApiProperty({
    description: 'Whether the budget is active',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Free-form notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
