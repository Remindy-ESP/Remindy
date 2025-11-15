import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EventSeries } from '../../domain/event-series.entity';
import {
  IEventSeriesRepository,
  EVENT_SERIES_REPOSITORY,
} from '../ports/event-series-repository.interface';

@Injectable()
export class FindEventSeriesBySubscriptionUseCase {
  constructor(
    @Inject(EVENT_SERIES_REPOSITORY)
    private readonly repository: IEventSeriesRepository,
  ) {}

  async execute(subscriptionId: string): Promise<EventSeries> {
    const eventSeries = await this.repository.findBySubscriptionId(subscriptionId);

    if (!eventSeries) {
      throw new NotFoundException(`Event series for subscription ${subscriptionId} not found`);
    }

    return eventSeries;
  }
}
