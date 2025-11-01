import { SubscriptionPeriodType } from '../../domain/subscription.entity';

export interface CreateSubscriptionAppDto {
  userId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  periodType: SubscriptionPeriodType;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}
