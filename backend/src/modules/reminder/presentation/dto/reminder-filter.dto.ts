import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReminderFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrer par ID de souscription',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par type de rappel',
    enum: ['subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'],
    example: 'subscription_renewal',
  })
  @IsOptional()
  @IsEnum(['subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par état actif/inactif',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Tri des résultats (created_at:asc|desc, updated_at:asc|desc)',
    example: 'created_at:desc',
    default: 'created_at:desc',
  })
  @IsOptional()
  sort?: string;
}
