import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISubscriptionRepository } from '../../application/ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionEntity } from '../persistence/subscription.entity';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { SubscriptionFilterAppDto } from '../../application/dto/subscription-filter-app.dto';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async create(subscription: Subscription): Promise<Subscription> {
    const entity = SubscriptionMapper.toPersistence(subscription);
    const saved = await this.repository.save(entity);
    return SubscriptionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Subscription | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return SubscriptionMapper.toDomain(entity);
  }

  async findAll(filters?: SubscriptionFilterAppDto): Promise<Subscription[]> {
    const queryBuilder = this.repository.createQueryBuilder('subscription');

    if (filters) {
      if (filters.userId) {
        queryBuilder.andWhere('subscription.userId = :userId', { userId: filters.userId });
      }

      if (filters.name) {
        queryBuilder.andWhere('subscription.name ILIKE :name', { name: `%${filters.name}%` });
      }

      if (filters.currency) {
        queryBuilder.andWhere('subscription.currency = :currency', { currency: filters.currency });
      }

      if (filters.periodType) {
        queryBuilder.andWhere('subscription.periodType = :periodType', {
          periodType: filters.periodType,
        });
      }

      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('subscription.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }
    }

    queryBuilder.orderBy('subscription.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return SubscriptionMapper.toDomainArray(entities);
  }

  async findByPeriodType(periodType: string): Promise<Subscription[]> {
    const entities = await this.repository.find({
      where: { periodType: periodType as any },
      order: { createdAt: 'DESC' },
    });

    return SubscriptionMapper.toDomainArray(entities);
  }

  async update(id: string, subscription: Subscription): Promise<Subscription | null> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      return null;
    }

    const entity = SubscriptionMapper.toPersistence(subscription);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return SubscriptionMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
