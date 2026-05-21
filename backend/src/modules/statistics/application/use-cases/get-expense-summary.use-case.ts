import { Inject, Injectable } from '@nestjs/common';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { Event } from '../../../event/domain/event.entity';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Subscription } from '../../../subscription/domain/subscription.entity';
import {
  COMPARISON_LABELS,
  DateRangeVO,
  formatPeriodLabel,
} from '../../domain/value-objects/date-range.vo';
import type { ExpenseSummaryAppDto, ExpenseTrend } from '../dto/expense-summary-app.dto';
import type { ExpenseSummaryQueryAppDto } from '../dto/expense-summary-query-app.dto';

const TREND_THRESHOLD = 0.1;

@Injectable()
export class GetExpenseSummaryUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
  ) {}

  async execute(query: ExpenseSummaryQueryAppDto): Promise<ExpenseSummaryAppDto> {
    const reference = query.referenceDate ?? new Date();
    const range = DateRangeVO.forPeriod(query.period, reference);

    const userSubscriptions = await this.findAllSubscriptionsUseCase.execute({
      userId: query.userId,
    });
    const userSubscriptionIds = new Set(
      userSubscriptions
        .map((s: Subscription) => s.id)
        .filter((id): id is string => id !== undefined),
    );

    if (userSubscriptionIds.size === 0) {
      return this.buildSummary(query.period, reference, 0, 0);
    }

    const [currentEvents, previousEvents] = await Promise.all([
      this.eventRepository.findAll({
        start: range.startDate,
        end: range.endDate,
      }),
      this.eventRepository.findAll({
        start: range.previousStartDate,
        end: range.previousEndDate,
      }),
    ]);

    const currentTotal = sumAmounts(currentEvents, userSubscriptionIds);
    const previousTotal = sumAmounts(previousEvents, userSubscriptionIds);

    return this.buildSummary(query.period, reference, currentTotal, previousTotal);
  }

  private buildSummary(
    period: ExpenseSummaryQueryAppDto['period'],
    reference: Date,
    currentTotal: number,
    previousTotal: number,
  ): ExpenseSummaryAppDto {
    const { percentageChange, trend } = computeChange(currentTotal, previousTotal);
    return {
      periodLabel: formatPeriodLabel(reference, period),
      currentTotal: round2(currentTotal),
      previousTotal: round2(previousTotal),
      percentageChange,
      trend,
      comparisonLabel: COMPARISON_LABELS[period],
    };
  }
}

function sumAmounts(events: Event[], allowedSubscriptionIds: Set<string>): number {
  return events.reduce((acc, event) => {
    if (!allowedSubscriptionIds.has(event.subscriptionId)) return acc;
    return acc + event.amount;
  }, 0);
}

function computeChange(
  current: number,
  previous: number,
): { percentageChange: number; trend: ExpenseTrend } {
  if (previous === 0) {
    // Going from 0 to >0 has no defined percentage; report 100/up as a sentinel.
    if (current === 0) return { percentageChange: 0, trend: 'stable' };
    return { percentageChange: 100, trend: 'up' };
  }

  const raw = ((current - previous) / previous) * 100;
  const percentageChange = round1(raw);

  let trend: ExpenseTrend = 'stable';
  if (percentageChange > TREND_THRESHOLD) trend = 'up';
  else if (percentageChange < -TREND_THRESHOLD) trend = 'down';

  return { percentageChange, trend };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
