import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import type { SubscriptionPeriodType } from '../../domain/subscription.entity';

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
    description: 'Filtrer par type de période',
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
    required: false,
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  periodType?: SubscriptionPeriodType;

  @ApiProperty({
    description: 'Filtrer par statut actif',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
