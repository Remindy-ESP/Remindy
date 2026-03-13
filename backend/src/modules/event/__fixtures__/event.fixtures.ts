import { Event } from '../domain/event.entity';
import { EventEntity } from '../infrastructure/persistence/event.entity';
export { makeEventSeries } from '../../event-series/__fixtures__/event-series.fixtures';

/** Use when startsAt varies (service tests, dedup tests). */
export function makeEvent(startsAt: Date = new Date('2025-01-01'), overrides: Record<string, any> = {}): Event {
  return new Event({
    id: 'evt-1',
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt,
    status: 'scheduled',
    ...overrides,
  });
}

/** Use when only field overrides are needed and startsAt stays at default (repository tests). */
export function makeEventDomain(overrides: Record<string, any> = {}): Event {
  return makeEvent(new Date('2025-01-01'), overrides);
}

export function makeEventEntity(overrides: Record<string, any> = {}): EventEntity {
  return Object.assign(new EventEntity(), {
    id: 'evt-1',
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt: new Date('2025-01-01'),
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}
