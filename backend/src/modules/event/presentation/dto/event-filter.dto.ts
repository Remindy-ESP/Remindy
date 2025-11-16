import { IsOptional, IsDateString, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EventFilterDto {
  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    required: false,
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    required: false,
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiProperty({ description: "ID de l'abonnement", required: false })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiProperty({
    description: "Statut de l'événement",
    enum: ['scheduled', 'completed', 'canceled', 'failed'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['scheduled', 'completed', 'canceled', 'failed'])
  status?: 'scheduled' | 'completed' | 'canceled' | 'failed';

  @ApiProperty({
    description: 'Statut de paiement',
    enum: ['pending', 'paid', 'failed'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed'])
  payment_status?: 'pending' | 'paid' | 'failed';

  @ApiProperty({
    description: 'Nombre limite de résultats',
    required: false,
    default: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiProperty({
    description: 'Tri des résultats',
    enum: ['starts_at:asc', 'starts_at:desc', 'amount:asc', 'amount:desc'],
    required: false,
    default: 'starts_at:asc',
  })
  @IsOptional()
  @IsEnum(['starts_at:asc', 'starts_at:desc', 'amount:asc', 'amount:desc'])
  sort?: 'starts_at:asc' | 'starts_at:desc' | 'amount:asc' | 'amount:desc';
}
