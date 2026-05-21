import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PERIODS, type Period } from '../../domain/value-objects/date-range.vo';

export class ExpenseSummaryQueryDto {
  @ApiProperty({
    description: 'Période agrégée pour le bilan des dépenses',
    enum: PERIODS,
    example: 'month',
  })
  @IsEnum(PERIODS)
  period!: Period;
}
