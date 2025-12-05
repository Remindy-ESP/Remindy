import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';

@Injectable()
export class DeleteSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(id: string, softDelete = true): Promise<void> {
    const exists = await this.subscriptionRepository.findById(id);

    if (!exists) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    let deleted: boolean;

    if (softDelete) {
      deleted = await this.subscriptionRepository.softDelete(id);
    } else {
      deleted = await this.subscriptionRepository.delete(id);
    }

    if (!deleted) {
      throw new NotFoundException(`Failed to delete subscription with id ${id}`);
    }
  }
}
