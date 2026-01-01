import type { SubscriptionFrequency, SubscriptionStatus } from '../../domain/subscription.entity';

export interface CreateSubscriptionAppDto {
  userId: string;
  contractId?: number;
  categoryId?: string;
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
  // Options de génération d'événements
  generateEvents?: boolean;
  eventsToGenerate?: number;
  timezone?: string;
}
