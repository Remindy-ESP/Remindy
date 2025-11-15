import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Subscription } from '../../domain/subscription.entity';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';

@Injectable()
export class PauseSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly repository: ISubscriptionRepository,
  ) {}

  async execute(id: string): Promise<Subscription> {
    const subscription = await this.repository.findById(id);

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    subscription.pause();

    const updated = await this.repository.update(id, subscription);

    if (!updated) {
      throw new NotFoundException(`Failed to update subscription with id ${id}`);
    }

    return updated;
  }
}
