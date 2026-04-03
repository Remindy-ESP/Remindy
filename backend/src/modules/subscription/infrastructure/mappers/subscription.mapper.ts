import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionEntity } from '../persistence/subscription.entity';

export class SubscriptionMapper {
  static toDomain(entity: SubscriptionEntity): Subscription {
    const subscription = new Subscription({
      id: entity.id,
      userId: entity.userId,
      contractId: entity.contractId,
      categoryId: entity.categoryId,
      name: entity.name,
      amount: Number(entity.amount),
      currency: entity.currency,
      frequency: entity.frequency,
      startDate: entity.startDate,
      endDate: entity.endDate,
      nextDueDate: entity.nextDueDate,
      trialStartDate: entity.trialStartDate,
      trialEndDate: entity.trialEndDate,
      isTrialActive: entity.isTrialActive,
      status: entity.status,
      color: entity.color,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
    // Carry the eagerly-loaded category relation so it can be serialized in response DTOs
    (subscription as any).category = entity.category ?? undefined;
    return subscription;
  }

  static toPersistence(domain: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.userId = domain.userId;
    entity.contractId = domain.contractId;
    entity.categoryId = domain.categoryId;
    entity.name = domain.name;
    entity.amount = domain.amount;
    entity.currency = domain.currency;
    entity.frequency = domain.frequency;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.nextDueDate = domain.nextDueDate;
    entity.trialStartDate = domain.trialStartDate;
    entity.trialEndDate = domain.trialEndDate;

    // isTrialActive is GENERATED, no need to set
    entity.status = domain.status;
    entity.color = domain.color;
    entity.notes = domain.notes;

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
