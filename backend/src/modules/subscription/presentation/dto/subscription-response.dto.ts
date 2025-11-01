import { ApiProperty } from '@nestjs/swagger';
import type { SubscriptionPeriodType } from '../../domain/subscription.entity';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'ID de l\'abonnement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Nom de l\'abonnement',
    example: 'Netflix Premium',
  })
  name: string;

  @ApiProperty({
    description: 'Description de l\'abonnement',
    example: 'Abonnement mensuel Netflix avec 4 écrans',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Montant de l\'abonnement',
    example: 15.99,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Devise (code ISO 4217)',
    example: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Type de période de facturation',
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
  })
  periodType: SubscriptionPeriodType;

  @ApiProperty({
    description: 'Date de début de l\'abonnement',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Date de fin de l\'abonnement',
    example: '2025-12-31T23:59:59Z',
    required: false,
    type: String,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Indique si l\'abonnement est actif',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2025-01-15T12:30:00Z',
    type: String,
  })
  updatedAt: Date;
}
