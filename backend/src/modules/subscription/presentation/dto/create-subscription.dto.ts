import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import type { SubscriptionPeriodType } from '../../domain/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire de l\'abonnement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Nom de l\'abonnement',
    example: 'Netflix Premium',
    maxLength: 255,
  })
  @IsString()
  name: string;

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
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Devise (code ISO 4217)',
    example: 'EUR',
    maxLength: 3,
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Type de période de facturation',
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
  })
  @IsEnum(['day', 'week', 'month', 'year'])
  periodType: SubscriptionPeriodType;

  @ApiProperty({
    description: 'Date de début de l\'abonnement',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Date de fin de l\'abonnement (optionnelle)',
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
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
