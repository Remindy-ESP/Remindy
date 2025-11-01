import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionEntity } from '../persistence/subscription.entity';

export class SubscriptionMapper {
  static toDomain(entity: SubscriptionEntity): Subscription {
    return new Subscription({
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      amount: Number(entity.amount),
      currency: entity.currency,
      periodType: entity.periodType,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  static toPersistence(domain: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.userId = domain.userId;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    entity.periodType = domain.periodType;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.isActive = domain.isActive;

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

  static toDomainArray(entities: SubscriptionEntity[]): Subscription[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
