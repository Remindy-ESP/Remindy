import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export class SubscriptionFilterDto {
  @ApiProperty({
    description: 'Filtrer par ID utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filtrer par ID de contrat',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  contractId?: number;

  @ApiProperty({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'Netflix',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filtrer par devise',
    example: 'EUR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Filtrer par fréquence',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsEnum(['weekly', 'monthly', 'quarterly', 'yearly'])
  frequency?: SubscriptionFrequency;

  @ApiProperty({
    description: 'Filtrer par statut',
    enum: ['active', 'paused', 'cancelled', 'trial'],
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsEnum(['active', 'paused', 'cancelled', 'trial'])
  status?: SubscriptionStatus;
}
