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
      contractId: dto.contractId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      frequency: dto.frequency,
      startDate: dto.startDate,
      nextDueDate: dto.nextDueDate,
      trialStartDate: dto.trialStartDate,
      trialEndDate: dto.trialEndDate,
      status: dto.status,
      color: dto.color,
      notes: dto.notes,
    });

    return await this.subscriptionRepository.create(subscription);
  }
}
