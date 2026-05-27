import { Budget } from '../../domain/budget.entity';
import { BudgetEntity } from '../persistence/budget.entity';

export class BudgetMapper {
  static toDomain(entity: BudgetEntity): Budget {
    return new Budget({
      id: entity.id,
      userId: entity.userId,
      categoryId: entity.categoryId,
      subscriptionIds: entity.subscriptions?.map(s => s.id) ?? [],
      name: entity.name,
      amount: typeof entity.amount === 'string' ? parseFloat(entity.amount) : entity.amount,
      currency: entity.currency,
      period: entity.period,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isActive: entity.isActive,
      notes: entity.notes ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  static toPersistence(domain: Budget): BudgetEntity {
    const entity = new BudgetEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.userId = domain.userId;
    entity.categoryId = domain.categoryId ?? null;
    entity.name = domain.name;
    entity.amount = domain.amount.toFixed(2);
    entity.currency = domain.currency;
    entity.period = domain.period;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate ?? null;
    entity.isActive = domain.isActive;
    entity.notes = domain.notes ?? null;
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

  static toDomainArray(entities: BudgetEntity[]): Budget[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
