import { Event } from '../../domain/event.entity';
import { EventEntity } from '../persistence/event.entity';

export class EventMapper {
  static toDomain(entity: EventEntity): Event {
    return new Event({
      id: entity.id,
      subscriptionId: entity.subscriptionId,
      eventSeriesId: entity.eventSeriesId,
      title: entity.title,
      amount: parseFloat(entity.amount.toString()),
      startsAt: entity.startsAt,
      endsAt: entity.endsAt,
      status: entity.status,
      paymentStatus: entity.paymentStatus,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  static toPersistence(event: Event): EventEntity {
    const entity = new EventEntity();
    if (event.id) {
      entity.id = event.id;
    }
    entity.subscriptionId = event.subscriptionId;
    entity.eventSeriesId = event.eventSeriesId;
    entity.title = event.title;
    entity.amount = event.amount;
    entity.startsAt = event.startsAt;
    entity.endsAt = event.endsAt;
    entity.status = event.status;
    entity.paymentStatus = event.paymentStatus;
    entity.notes = event.notes;
    if (event.createdAt) {
      entity.createdAt = event.createdAt;
    }
    if (event.updatedAt) {
      entity.updatedAt = event.updatedAt;
    }
    entity.deletedAt = event.deletedAt;
    return entity;
  }

  static toDomainArray(entities: EventEntity[]): Event[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
