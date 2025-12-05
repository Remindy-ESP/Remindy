import { Injectable, Inject } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionFilterAppDto } from '../dto/subscription-filter-app.dto';

@Injectable()
export class FindAllSubscriptionsUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(filters?: SubscriptionFilterAppDto): Promise<Subscription[]> {
    return await this.subscriptionRepository.findAll(filters);
  }
}
