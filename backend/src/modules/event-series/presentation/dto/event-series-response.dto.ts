import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventSeriesResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  subscriptionId: string;

  @ApiProperty({ example: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15' })
  rrule: string;

  @ApiProperty({ example: '2025-01-15T00:00:00Z' })
  dtstart: Date;

  @ApiProperty({ example: 'Europe/Paris' })
  timezone: string;

  @ApiPropertyOptional({ type: [Date], example: ['2025-08-15T00:00:00Z'] })
  exdates?: Date[];

  @ApiPropertyOptional({ type: [Date], example: ['2025-03-21T00:00:00Z'] })
  rdates?: Date[];

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  updatedAt: Date;
}
