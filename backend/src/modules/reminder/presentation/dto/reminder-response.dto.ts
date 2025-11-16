import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReminderResponseDto {
  @ApiProperty({
    description: 'ID du rappel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'ID de la souscription',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscription_id?: string;

  @ApiProperty({
    description: 'Type de rappel',
    example: 'subscription_renewal',
    enum: ['subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'],
  })
  type: string;

  @ApiProperty({
    description: 'Nombre de jours avant l\'événement',
    example: 7,
  })
  days_before: number;

  @ApiProperty({
    description: 'Rappel activé ou non',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Canal de notification',
    example: 'email',
    enum: ['email', 'push', 'sms'],
  })
  channel: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-11-06T15:00:00Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2025-11-06T16:00:00Z',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Date de suppression (soft delete)',
    example: '2025-11-10T10:00:00Z',
  })
  deleted_at?: string;
}
