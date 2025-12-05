import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export interface CreateSubscriptionAppDto {
  userId: string;
  contractId?: number;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  startDate: Date;
  nextDueDate: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  status: SubscriptionStatus;
  color?: string;
  notes?: string;
}
