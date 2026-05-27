import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ComparisonQueryDto {
  @ApiProperty({
    description: 'Start of the current period (ISO 8601)',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsDateString()
  currentStart!: string;

  @ApiProperty({
    description: 'End of the current period (ISO 8601, exclusive)',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsDateString()
  currentEnd!: string;

  @ApiProperty({
    description: 'Start of the comparison period (ISO 8601)',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsDateString()
  compareStart!: string;

  @ApiProperty({
    description: 'End of the comparison period (ISO 8601, exclusive)',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsDateString()
  compareEnd!: string;

  @ApiProperty({
    description: 'Optional category UUID to restrict the comparison',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
