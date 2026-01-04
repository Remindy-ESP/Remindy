import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  IsUUID,
  Matches,
} from 'class-validator';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'ID de la catégorie de contrat (optionnel, deprecated - use categoryId)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  contractId?: number;

  @ApiProperty({
    description: 'ID de la catégorie (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: "Nom de l'abonnement",
    example: 'Netflix Premium HD',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Montant de l'abonnement",
    example: 17.99,
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
    description: 'Fréquence de facturation',
    enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsEnum(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'])
  frequency?: SubscriptionFrequency;

  @ApiProperty({
    description: "Date de début de l'abonnement",
    example: '2025-01-01',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: "Prochaine date d'échéance",
    example: '2025-02-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiProperty({
    description: "Date de début de la période d'essai",
    example: '2025-01-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  trialStartDate?: string;

  @ApiProperty({
    description: "Date de fin de la période d'essai",
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
    required: false,
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
}
