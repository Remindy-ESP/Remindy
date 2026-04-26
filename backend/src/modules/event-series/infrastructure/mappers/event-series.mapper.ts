import { EventSeries } from '../../domain/event-series.entity';
import { EventSeriesEntity } from '../persistence/event-series.entity';

export class EventSeriesMapper {
  static toDomain(entity: EventSeriesEntity): EventSeries {
    return new EventSeries({
      id: entity.id,
      subscriptionId: entity.subscriptionId,
      rrule: entity.rrule,
      dtstart: entity.dtstart,
      timezone: entity.timezone,
      exdates: entity.exdates,
      rdates: entity.rdates,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  static toPersistence(domain: EventSeries): EventSeriesEntity {
    const entity = new EventSeriesEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.subscriptionId = domain.subscriptionId;
    entity.rrule = domain.rrule;
    entity.dtstart = domain.dtstart;
    entity.timezone = domain.timezone;
    entity.exdates = domain.exdates;
    entity.rdates = domain.rdates;

    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }

    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }

    if (domain.deletedAt) {
      entity.deletedAt = domain.deletedAt;
    }

    return entity;
  }

  static toDomainArray(entities: EventSeriesEntity[]): EventSeries[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
