import { Event, EventStatus } from '../../domain/event.entity';
import { EventFilterAppDto } from '../dto/event-filter-app.dto';

export interface IEventRepository {
  create(event: Event): Promise<Event>;
  createMany(events: Event[]): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  findAll(filters?: EventFilterAppDto): Promise<Event[]>;
  findBySubscriptionId(subscriptionId: string): Promise<Event[]>;
  update(id: string, event: Event): Promise<Event | null>;
  updateFutureEventsStatus(subscriptionId: string, newStatus: EventStatus): Promise<number>;
  cancelEventsAfterDate(subscriptionId: string, afterDate: Date): Promise<number>;
  cancelScheduledEventOnDate(subscriptionId: string, date: Date): Promise<number>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const EVENT_REPOSITORY = Symbol('IEventRepository');
