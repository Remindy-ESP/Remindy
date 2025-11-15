import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSeries } from '../../domain/event-series.entity';
import { EventSeriesEntity } from '../persistence/event-series.entity';
import { EventSeriesMapper } from '../mappers/event-series.mapper';
import { IEventSeriesRepository } from '../../application/ports/event-series-repository.interface';

@Injectable()
export class EventSeriesRepository implements IEventSeriesRepository {
  constructor(
    @InjectRepository(EventSeriesEntity)
    private readonly repository: Repository<EventSeriesEntity>,
  ) {}

  async create(eventSeries: EventSeries): Promise<EventSeries> {
    const entity = EventSeriesMapper.toPersistence(eventSeries);
    const savedEntity = await this.repository.save(entity);
    return EventSeriesMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<EventSeries | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? EventSeriesMapper.toDomain(entity) : null;
  }

  async findBySubscriptionId(subscriptionId: string): Promise<EventSeries | null> {
    const entity = await this.repository.findOne({ where: { subscriptionId } });
    return entity ? EventSeriesMapper.toDomain(entity) : null;
  }

  async update(id: string, eventSeries: EventSeries): Promise<EventSeries | null> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }

    const entity = EventSeriesMapper.toPersistence(eventSeries);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return EventSeriesMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}
