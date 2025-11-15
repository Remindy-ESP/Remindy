import { EventSeries } from '../../domain/event-series.entity';

export interface IEventSeriesRepository {
  create(eventSeries: EventSeries): Promise<EventSeries>;
  findById(id: string): Promise<EventSeries | null>;
  findBySubscriptionId(subscriptionId: string): Promise<EventSeries | null>;
  update(id: string, eventSeries: EventSeries): Promise<EventSeries | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const EVENT_SERIES_REPOSITORY = 'EVENT_SERIES_REPOSITORY';
