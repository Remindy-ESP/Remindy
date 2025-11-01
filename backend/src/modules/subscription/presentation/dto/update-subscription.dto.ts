import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import type { SubscriptionPeriodType } from '../../domain/subscription.entity';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Nom de l\'abonnement',
    example: 'Netflix Premium',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Description de l\'abonnement',
    example: 'Abonnement mensuel Netflix avec 4 écrans',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Montant de l\'abonnement',
    example: 15.99,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({
    description: 'Devise (code ISO 4217)',
    example: 'EUR',
    maxLength: 3,
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Type de période de facturation',
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
    required: false,
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  periodType?: SubscriptionPeriodType;

  @ApiProperty({
    description: 'Date de début de l\'abonnement',
    example: '2025-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Date de fin de l\'abonnement',
    example: '2025-12-31T23:59:59Z',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Indique si l\'abonnement est actif',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
