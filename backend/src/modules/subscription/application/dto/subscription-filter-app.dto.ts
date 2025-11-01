import { SubscriptionPeriodType } from '../../domain/subscription.entity';

export interface SubscriptionFilterAppDto {
  userId?: string;
  name?: string;
  currency?: string;
  periodType?: SubscriptionPeriodType;
  isActive?: boolean;
}
