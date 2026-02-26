import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription, SubscriptionFrequency } from '../../domain/subscription.entity';

@Injectable()
export class FindSubscriptionsByPeriodUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(frequency: string): Promise<Subscription[]> {
    const validFrequencies: SubscriptionFrequency[] = [
      'one-time',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
    ];

    if (!validFrequencies.includes(frequency as SubscriptionFrequency)) {
      throw new BadRequestException(
        `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
      );
    }

    return await this.subscriptionRepository.findByFrequency(frequency as SubscriptionFrequency);
  }
}
