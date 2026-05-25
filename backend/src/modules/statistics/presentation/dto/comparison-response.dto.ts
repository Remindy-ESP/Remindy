import { ApiProperty } from '@nestjs/swagger';

export type ComparisonTrend = 'up' | 'down' | 'stable';

export class ComparisonPeriodDto {
  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  start!: Date;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  end!: Date;

  @ApiProperty({ example: 218.45 })
  total!: number;
}

export class ComparisonResponseDto {
  @ApiProperty({ type: ComparisonPeriodDto })
  current!: ComparisonPeriodDto;

  @ApiProperty({ type: ComparisonPeriodDto })
  previous!: ComparisonPeriodDto;

  @ApiProperty({ example: 12.45, description: 'current.total - previous.total' })
  delta!: number;

  @ApiProperty({
    description:
      'Percentage change: ((current - previous) / previous) * 100, rounded to 1 decimal. When previous is 0 and current > 0, returns 100.',
    example: 5.7,
  })
  percentageChange!: number;

  @ApiProperty({ enum: ['up', 'down', 'stable'], example: 'up' })
  trend!: ComparisonTrend;
}
