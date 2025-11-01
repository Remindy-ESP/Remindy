import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription, SubscriptionPeriodType } from '../../domain/subscription.entity';

@Injectable()
export class FindSubscriptionsByPeriodUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(periodType: string): Promise<Subscription[]> {
    const validPeriodTypes: SubscriptionPeriodType[] = ['day', 'week', 'month', 'year'];

    if (!validPeriodTypes.includes(periodType as SubscriptionPeriodType)) {
      throw new BadRequestException(
        `Invalid period type. Must be one of: ${validPeriodTypes.join(', ')}`,
      );
    }

    return await this.subscriptionRepository.findByPeriodType(periodType);
  }
}
