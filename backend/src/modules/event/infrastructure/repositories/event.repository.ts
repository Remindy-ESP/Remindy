import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEventRepository } from '../../application/ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { EventEntity } from '../persistence/event.entity';
import { EventMapper } from '../mappers/event.mapper';
import { EventFilterAppDto } from '../../application/dto/event-filter-app.dto';

@Injectable()
export class EventRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly repository: Repository<EventEntity>,
  ) {}

  async create(event: Event): Promise<Event> {
    const entity = EventMapper.toPersistence(event);
    const saved = await this.repository.save(entity);
    return EventMapper.toDomain(saved);
  }

  async createMany(events: Event[]): Promise<Event[]> {
    const entities = events.map(event => EventMapper.toPersistence(event));
    const saved = await this.repository.save(entities);
    return EventMapper.toDomainArray(saved);
  }

  async findById(id: string): Promise<Event | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return EventMapper.toDomain(entity);
  }

  async findAll(filters?: EventFilterAppDto): Promise<Event[]> {
    const queryBuilder = this.repository.createQueryBuilder('event');

    if (filters) {
      if (filters.start) {
        queryBuilder.andWhere('event.startsAt >= :start', { start: filters.start });
      }

      if (filters.end) {
        queryBuilder.andWhere('event.startsAt <= :end', { end: filters.end });
      }

      if (filters.subscriptionId) {
        queryBuilder.andWhere('event.subscriptionId = :subscriptionId', {
          subscriptionId: filters.subscriptionId,
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('event.status = :status', {
          status: filters.status,
        });
      }

      if (filters.paymentStatus) {
        queryBuilder.andWhere('event.paymentStatus = :paymentStatus', {
          paymentStatus: filters.paymentStatus,
        });
      }

      // Sorting
      const sort = filters.sort ?? 'starts_at:asc';
      const [field, order] = sort.split(':');
      const orderField = field === 'starts_at' ? 'event.startsAt' : 'event.amount';
      const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
      queryBuilder.orderBy(orderField, orderDirection);

      // Limit
      if (filters.limit) {
        queryBuilder.limit(filters.limit);
      }
    } else {
      queryBuilder.orderBy('event.startsAt', 'ASC').limit(100);
    }

    const entities = await queryBuilder.getMany();
    return EventMapper.toDomainArray(entities);
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Event[]> {
    const entities = await this.repository.find({
      where: { subscriptionId },
      order: { startsAt: 'ASC' },
    });
    return EventMapper.toDomainArray(entities);
  }

  async update(id: string, event: Event): Promise<Event | null> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      return null;
    }

    const entity = EventMapper.toPersistence(event);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return EventMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateFutureEventsStatus(subscriptionId: string, newStatus: string): Promise<number> {
    const now = new Date();
    const result = await this.repository
      .createQueryBuilder()
      .update(EventEntity)
      .set({ status: newStatus as any })
      .where('subscriptionId = :subscriptionId', { subscriptionId })
      .andWhere('startsAt > :now', { now })
      .andWhere('status = :scheduledStatus', { scheduledStatus: 'scheduled' })
      .execute();

    return result.affected ?? 0;
  }

  async cancelScheduledEventOnDate(subscriptionId: string, date: Date): Promise<number> {
    // Annule l'événement planifié exactement à cette date (à la journée près, indépendamment de l'heure)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await this.repository
      .createQueryBuilder()
      .update(EventEntity)
      .set({ status: 'canceled' as any })
      .where('subscriptionId = :subscriptionId', { subscriptionId })
      .andWhere('startsAt >= :startOfDay', { startOfDay })
      .andWhere('startsAt <= :endOfDay', { endOfDay })
      .andWhere('status = :scheduledStatus', { scheduledStatus: 'scheduled' })
      .execute();

    return result.affected ?? 0;
  }

  async cancelEventsAfterDate(subscriptionId: string, afterDate: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(EventEntity)
      .set({ status: 'canceled' as any })
      .where('subscriptionId = :subscriptionId', { subscriptionId })
      .andWhere('startsAt > :afterDate', { afterDate })
      .andWhere('status = :scheduledStatus', { scheduledStatus: 'scheduled' })
      .execute();

    return result.affected ?? 0;
  }
}
