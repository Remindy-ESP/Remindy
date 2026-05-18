import type { ExpenseSummaryAppDto } from '../../application/dto/expense-summary-app.dto';
import { ExpenseSummaryResponseDto } from '../dto/expense-summary-response.dto';

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
}
