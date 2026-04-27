import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateEventSeriesDto {
  @ApiProperty({
    description: "ID de l'abonnement",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({
    description: 'Règle de récurrence au format RRULE (RFC 5545)',
    example: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
  })
  @IsString()
  @IsNotEmpty()
  rrule: string;

  @ApiProperty({
    description: 'Date de début de la série (ISO 8601)',
    example: '2025-01-15T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dtstart: string;

  @ApiPropertyOptional({
    description: 'Fuseau horaire',
    example: 'Europe/Paris',
    default: 'Europe/Paris',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: "Dates d'exception (à exclure de la récurrence)",
    type: [String],
    example: ['2025-08-15T00:00:00Z', '2025-12-15T00:00:00Z'],
  })
  @IsArray()
  @IsDateString({}, { each: true })
  @IsOptional()
  exdates?: string[];

  @ApiPropertyOptional({
    description: 'Dates additionnelles (à ajouter à la récurrence)',
    type: [String],
    example: ['2025-03-21T00:00:00Z'],
  })
  @IsArray()
  @IsDateString({}, { each: true })
  @IsOptional()
  rdates?: string[];
}
