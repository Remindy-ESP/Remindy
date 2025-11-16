import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty({
    description: "ID unique de l'événement",
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ description: "ID de l'abonnement associé", example: 'sub-123' })
  subscriptionId: string;

  @ApiProperty({ description: "ID de la série d'événements", required: false })
  eventSeriesId?: string;

  @ApiProperty({ description: "Titre de l'événement", example: 'Paiement Netflix Premium' })
  title: string;

  @ApiProperty({ description: 'Montant', example: 15.99 })
  amount: number;

  @ApiProperty({ description: 'Date de début', example: '2025-02-01T00:00:00.000Z' })
  startsAt: string;

  @ApiProperty({ description: 'Date de fin', required: false, example: '2025-02-01T01:00:00.000Z' })
  endsAt?: string;

  @ApiProperty({
    description: 'Statut',
    enum: ['scheduled', 'completed', 'canceled', 'failed'],
    example: 'scheduled',
  })
  status: string;

  @ApiProperty({
    description: 'Statut de paiement',
    enum: ['pending', 'paid', 'failed'],
    required: false,
    example: 'pending',
  })
  paymentStatus?: string;

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Date de création', example: '2025-01-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Date de dernière mise à jour', example: '2025-01-01T10:00:00.000Z' })
  updatedAt: string;
}
