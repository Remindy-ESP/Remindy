import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionFilterAppDto } from '../dto/subscription-filter-app.dto';

export interface ISubscriptionRepository {
  create(subscription: Subscription): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findAll(filters?: SubscriptionFilterAppDto): Promise<Subscription[]>;
  findByPeriodType(periodType: string): Promise<Subscription[]>;
  update(id: string, subscription: Subscription): Promise<Subscription | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('ISubscriptionRepository');
