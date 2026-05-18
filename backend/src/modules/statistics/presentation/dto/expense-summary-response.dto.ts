import { ApiProperty } from '@nestjs/swagger';
import type { ExpenseTrend } from '../../application/dto/expense-summary-app.dto';

export class ExpenseSummaryResponseDto {
  @ApiProperty({ description: 'Libellé localisé de la période', example: '5 octobre 2025' })
  periodLabel!: string;

  @ApiProperty({ description: 'Total dépensé sur la période courante (EUR)', example: 203.85 })
  currentTotal!: number;

  @ApiProperty({ description: 'Total dépensé sur la période de comparaison (EUR)', example: 211.2 })
  previousTotal!: number;

  @ApiProperty({
    description:
      "Variation en pourcentage entre la période courante et la précédente, arrondie à 1 décimale. Vaut 100 et 'up' lorsque la période précédente est nulle et la courante > 0.",
    example: -3.5,
  })
  percentageChange!: number;

  @ApiProperty({
    description: 'Tendance déduite de la variation',
    enum: ['up', 'down', 'stable'],
    example: 'down',
  })
  trend!: ExpenseTrend;

  @ApiProperty({
    description: 'Libellé du bouton de comparaison à afficher dans le header',
    example: 'Comparo M-1',
  })
  comparisonLabel!: string;
}
