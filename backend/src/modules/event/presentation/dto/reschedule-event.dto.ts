import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleEventDto {
  @ApiProperty({ description: 'Nouvelle date de début (ISO 8601)', example: '2025-02-15T14:00:00Z' })
  @IsDateString()
  starts_at: string;

  @ApiProperty({ description: 'Nouvelle date de fin (ISO 8601)', required: false, example: '2025-02-15T15:00:00Z' })
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiProperty({ description: 'Notes sur la reprogrammation', required: false })
  @IsOptional()
  notes?: string;
}
