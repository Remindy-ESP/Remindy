import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export interface SubscriptionFilterAppDto {
  userId?: string;
  contractId?: number;
  name?: string;
  currency?: string;
  frequency?: SubscriptionFrequency;
  status?: SubscriptionStatus;
  categoryId?: string;
}
