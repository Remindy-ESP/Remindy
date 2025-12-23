import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  Matches,
} from 'class-validator';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({
    description:
      "ID de l'utilisateur propriétaire de l'abonnement (automatically set from JWT token)",
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'ID de la catégorie de contrat (optionnel)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  contractId?: number;

  @ApiProperty({
    description: "Nom de l'abonnement",
    example: 'Netflix Premium',
    maxLength: 255,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Montant de l'abonnement",
    example: 15.99,
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Devise (code ISO 4217)',
    example: 'EUR',
    maxLength: 3,
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Fréquence de facturation',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['weekly', 'monthly', 'quarterly', 'yearly'])
  frequency: SubscriptionFrequency;

  @ApiProperty({
    description: "Date de début de l'abonnement",
    example: '2025-01-01',
    type: String,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Prochaine date d'échéance (calculée automatiquement si non fournie)",
    example: '2025-02-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiProperty({
    description: "Date de début de la période d'essai (optionnelle)",
    example: '2025-01-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  trialStartDate?: string;

  @ApiProperty({
    description: "Date de fin de la période d'essai (optionnelle)",
    example: '2025-02-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  trialEndDate?: string;

  @ApiProperty({
    description: "Statut de l'abonnement",
    enum: ['active', 'paused', 'cancelled', 'trial'],
    example: 'active',
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'paused', 'cancelled', 'trial'])
  status?: SubscriptionStatus;

  @ApiProperty({
    description: 'Couleur HEX pour le calendrier',
    example: '#FF5733',
    required: false,
  })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid HEX color code (e.g., #FF5733)',
  })
  color?: string;

  @ApiProperty({
    description: "Notes sur l'abonnement",
    example: 'Abonnement familial partagé avec 3 personnes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Générer automatiquement les événements de paiement',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  generateEvents?: boolean;

  @ApiProperty({
    description: "Nombre d'événements à générer (en mois)",
    example: 12,
    default: 12,
    minimum: 1,
    maximum: 24,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  eventsToGenerate?: number;

  @ApiProperty({
    description: 'Fuseau horaire pour les événements',
    example: 'Europe/Paris',
    default: 'Europe/Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
