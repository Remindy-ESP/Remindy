import type { ExpenseSummaryAppDto } from '../../application/dto/expense-summary-app.dto';
import type { ComparisonAppDto } from '../../application/dto/comparison-app.dto';
import { ExpenseSummaryResponseDto } from '../dto/expense-summary-response.dto';
import { ComparisonPeriodDto, ComparisonResponseDto } from '../dto/comparison-response.dto';

export class StatisticsPresentationMapper {
  static toExpenseSummaryResponse(app: ExpenseSummaryAppDto): ExpenseSummaryResponseDto {
    const dto = new ExpenseSummaryResponseDto();
    dto.periodLabel = app.periodLabel;
    dto.currentTotal = app.currentTotal;
    dto.previousTotal = app.previousTotal;
    dto.percentageChange = app.percentageChange;
    dto.trend = app.trend;
    dto.comparisonLabel = app.comparisonLabel;
    return dto;
  }

  static toComparisonResponse(app: ComparisonAppDto): ComparisonResponseDto {
    const dto = new ComparisonResponseDto();
    dto.current = toPeriod(app.current);
    dto.previous = toPeriod(app.previous);
    dto.delta = app.delta;
    dto.percentageChange = app.percentageChange;
    dto.trend = app.trend;
    return dto;
  }
}

function toPeriod(p: { start: Date; end: Date; total: number }): ComparisonPeriodDto {
  const dto = new ComparisonPeriodDto();
  dto.start = p.start;
  dto.end = p.end;
  dto.total = p.total;
  return dto;
}
