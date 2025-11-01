import { Injectable, Inject } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionAppDto } from '../dto/create-subscription-app.dto';

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: CreateSubscriptionAppDto): Promise<Subscription> {
    const subscription = new Subscription({
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      periodType: dto.periodType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: dto.isActive ?? true,
    });

    return await this.subscriptionRepository.create(subscription);
  }
}
