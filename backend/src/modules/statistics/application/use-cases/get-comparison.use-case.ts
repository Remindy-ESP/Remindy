import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Event } from '../../../event/domain/event.entity';
import { Subscription } from '../../../subscription/domain/subscription.entity';
import {
  ComparisonAppDto,
  ComparisonPeriod,
  ComparisonTrend,
} from '../dto/comparison-app.dto';
import { ComparisonQueryAppDto } from '../dto/comparison-query-app.dto';

const TREND_THRESHOLD = 0.1;

@Injectable()
export class GetComparisonUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
  ) {}

  async execute(query: ComparisonQueryAppDto): Promise<ComparisonAppDto> {
    if (query.currentEnd <= query.currentStart) {
      throw new BadRequestException('currentEnd must be after currentStart');
    }
    if (query.compareEnd <= query.compareStart) {
      throw new BadRequestException('compareEnd must be after compareStart');
    }

    const subscriptions = await this.findAllSubscriptionsUseCase.execute({
      userId: query.userId,
    });

    const allowedSubscriptionIds = filterSubscriptionIds(subscriptions, query.categoryId);

    if (allowedSubscriptionIds.size === 0) {
      return buildComparison(
        { start: query.currentStart, end: query.currentEnd, total: 0 },
        { start: query.compareStart, end: query.compareEnd, total: 0 },
      );
    }

    const [currentEvents, previousEvents] = await Promise.all([
      this.eventRepository.findAll({ start: query.currentStart, end: query.currentEnd }),
      this.eventRepository.findAll({ start: query.compareStart, end: query.compareEnd }),
    ]);

    const current: ComparisonPeriod = {
      start: query.currentStart,
      end: query.currentEnd,
      total: sumAmounts(currentEvents, allowedSubscriptionIds),
    };
    const previous: ComparisonPeriod = {
      start: query.compareStart,
      end: query.compareEnd,
      total: sumAmounts(previousEvents, allowedSubscriptionIds),
    };

    return buildComparison(current, previous);
  }
}

function filterSubscriptionIds(
  subscriptions: Subscription[],
  categoryId?: string,
): Set<string> {
  const ids = new Set<string>();
  for (const sub of subscriptions) {
    if (!sub.id) continue;
    if (categoryId && sub.categoryId !== categoryId) continue;
    ids.add(sub.id);
  }
  return ids;
}

function sumAmounts(events: Event[], allowed: Set<string>): number {
  return events.reduce((total, event) => {
    if (!allowed.has(event.subscriptionId)) return total;
    if (event.status === 'canceled') return total;
    return total + event.amount;
  }, 0);
}

function buildComparison(current: ComparisonPeriod, previous: ComparisonPeriod): ComparisonAppDto {
  const currentTotal = round2(current.total);
  const previousTotal = round2(previous.total);
  const delta = round2(currentTotal - previousTotal);
  const { percentageChange, trend } = computeChange(currentTotal, previousTotal);
  return {
    current: { ...current, total: currentTotal },
    previous: { ...previous, total: previousTotal },
    delta,
    percentageChange,
    trend,
  };
}

function computeChange(
  current: number,
  previous: number,
): { percentageChange: number; trend: ComparisonTrend } {
  if (previous === 0) {
    if (current === 0) return { percentageChange: 0, trend: 'stable' };
    return { percentageChange: 100, trend: 'up' };
  }

  const raw = ((current - previous) / previous) * 100;
  const percentageChange = round1(raw);

  let trend: ComparisonTrend = 'stable';
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
