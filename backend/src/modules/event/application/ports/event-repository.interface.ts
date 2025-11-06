import { Event } from '../../domain/event.entity';
import { EventFilterAppDto } from '../dto/event-filter-app.dto';

export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findAll(filters?: EventFilterAppDto): Promise<Event[]>;
  update(id: string, event: Event): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const EVENT_REPOSITORY = Symbol('IEventRepository');
