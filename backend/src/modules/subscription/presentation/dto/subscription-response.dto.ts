import { ApiProperty } from '@nestjs/swagger';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';
import { CategoryResponseDto } from '../../../category/presentation/dto/category-response.dto';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: "ID de l'abonnement",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "ID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'ID de la catégorie de contrat',
    example: 1,
    required: false,
  })
  contractId?: number;

  @ApiProperty({
    description: 'ID de la catégorie',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  categoryId?: string;

  @ApiProperty({
    description: "Catégorie associée à l'abonnement",
    type: () => CategoryResponseDto,
    required: false,
  })
  category?: CategoryResponseDto;

  @ApiProperty({
    description: "Nom de l'abonnement",
    example: 'Netflix Premium',
  })
  name: string;

  @ApiProperty({
    description: "Montant de l'abonnement",
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
    description: 'Fréquence de facturation',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    example: 'monthly',
  })
  frequency: SubscriptionFrequency;

  @ApiProperty({
    description: "Date de début de l'abonnement",
    example: '2025-01-01',
    type: String,
  })
  startDate: Date;

  @ApiProperty({
    description: "Date de fin de l'abonnement (optionnelle, pour les paiements à durée limitée)",
    example: '2025-05-01',
    required: false,
    type: String,
  })
  endDate?: Date;

  @ApiProperty({
    description: "Prochaine date d'échéance",
    example: '2025-02-01',
    type: String,
  })
  nextDueDate: Date;

  @ApiProperty({
    description: "Date de début de la période d'essai",
    example: '2025-01-01',
    required: false,
    type: String,
  })
  trialStartDate?: Date;

  @ApiProperty({
    description: "Date de fin de la période d'essai",
    example: '2025-02-01',
    required: false,
    type: String,
  })
  trialEndDate?: Date;

  @ApiProperty({
    description: "Indique si la période d'essai est active",
    example: true,
    required: false,
  })
  isTrialActive?: boolean;

  @ApiProperty({
    description: "Statut de l'abonnement",
    enum: ['active', 'paused', 'cancelled', 'trial'],
    example: 'active',
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Couleur HEX pour le calendrier',
    example: '#FF5733',
    required: false,
  })
  color?: string;

  @ApiProperty({
    description: "Notes sur l'abonnement",
    example: 'Abonnement familial partagé avec 3 personnes',
    required: false,
  })
  notes?: string;

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

  @ApiProperty({
    description: "Nombre d'événements de paiement générés",
    example: 12,
    required: false,
  })
  eventsGenerated?: number;
}
