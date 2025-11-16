import { IsNotEmpty, IsEnum, IsInt, Min, Max, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReminderDto {
  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur (sera remplacé par l\'utilisateur authentifié)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la souscription (optionnel pour les rappels globaux)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiProperty({
    description: 'Type de rappel',
    enum: ['subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'],
    example: 'subscription_renewal',
  })
  @IsNotEmpty()
  @IsEnum(['subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'])
  type: string;

  @ApiProperty({
    description: 'Nombre de jours avant l\'événement',
    example: 7,
    minimum: 1,
    maximum: 365,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days_before: number;

  @ApiPropertyOptional({
    description: 'Rappel activé ou non',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    description: 'Canal de notification',
    enum: ['email', 'push', 'sms'],
    example: 'email',
  })
  @IsNotEmpty()
  @IsEnum(['email', 'push', 'sms'])
  channel: string;
}
