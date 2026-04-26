import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'ID de la notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "ID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: "ID de l'événement lié",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  event_id?: string;

  @ApiPropertyOptional({
    description: 'ID du rappel lié',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  reminder_id?: string;

  @ApiProperty({
    description: 'Type de notification',
    example: 'reminder',
    enum: [
      'reminder',
      'payment_overdue',
      'trial_ending',
      'subscription_renewed',
      'document_processed',
    ],
  })
  type: string;

  @ApiProperty({
    description: 'Canal de notification',
    example: 'push',
    enum: ['email', 'push', 'sms'],
  })
  channel: string;

  @ApiProperty({
    description: 'Titre de la notification',
    example: 'Paiement Netflix dans 3 jours',
  })
  title: string;

  @ApiProperty({
    description: 'Corps de la notification',
    example: 'Votre abonnement Netflix de 15.99€ sera débité le 15 novembre',
  })
  body: string;

  @ApiPropertyOptional({
    description: "Date d'envoi",
    example: '2025-11-06T15:30:00Z',
  })
  sent_at?: string;

  @ApiPropertyOptional({
    description: 'Date de lecture',
    example: '2025-11-06T16:00:00Z',
  })
  read_at?: string;

  @ApiProperty({
    description: 'Statut de la notification',
    example: 'sent',
    enum: ['pending', 'sent', 'failed', 'snoozed'],
  })
  status: string;

  @ApiPropertyOptional({
    description: "Date jusqu'à laquelle la notification est reportée",
    example: '2025-11-10T10:00:00Z',
  })
  snoozed_until?: string;

  @ApiPropertyOptional({
    description: "Message d'erreur si échec",
    example: 'SMTP timeout',
  })
  error_message?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: { message_id: 'msg_abc123' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-11-06T15:00:00Z',
  })
  created_at: string;

  @ApiPropertyOptional({
    description: 'Date de suppression (soft delete)',
    example: '2025-11-10T10:00:00Z',
  })
  deleted_at?: string;
}
