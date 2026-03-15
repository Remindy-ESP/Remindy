import { Subscription } from '../domain/subscription.entity';
import { SubscriptionEntity } from '../infrastructure/persistence/subscription.entity';

export function makeSubscription(overrides: Record<string, any> = {}): Subscription {
  return new Subscription({
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    status: 'active',
    ...overrides,
  });
}

export function makeSubscriptionEntity(overrides: Record<string, any> = {}): SubscriptionEntity {
  return Object.assign(new SubscriptionEntity(), {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}
