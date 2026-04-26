import { EventSeries } from '../domain/event-series.entity';
import { EventSeriesEntity } from '../infrastructure/persistence/event-series.entity';

export function makeEventSeries(overrides: Record<string, any> = {}): EventSeries {
  return new EventSeries({
    id: 'series-1',
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    ...overrides,
  });
}

export function makeEventSeriesEntity(overrides: Record<string, any> = {}): EventSeriesEntity {
  return Object.assign(new EventSeriesEntity(), {
    id: 'series-1',
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}
