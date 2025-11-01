import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { UpdateSubscriptionAppDto } from '../dto/update-subscription-app.dto';

@Injectable()
export class UpdateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(id: string, dto: UpdateSubscriptionAppDto): Promise<Subscription> {
    const existingSubscription = await this.subscriptionRepository.findById(id);

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    // Apply updates
    if (dto.name !== undefined) {
      existingSubscription.updateName(dto.name);
    }

    if (dto.description !== undefined) {
      existingSubscription.updateDescription(dto.description);
    }

    if (dto.amount !== undefined) {
      existingSubscription.updateAmount(dto.amount);
    }

    if (dto.currency !== undefined) {
      existingSubscription.updateCurrency(dto.currency);
    }

    if (dto.periodType !== undefined) {
      existingSubscription.updatePeriodType(dto.periodType);
    }

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      const newStartDate = dto.startDate ?? existingSubscription.startDate;
      const newEndDate = dto.endDate !== undefined ? dto.endDate : existingSubscription.endDate;
      existingSubscription.updateDates(newStartDate, newEndDate);
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        existingSubscription.activate();
      } else {
        existingSubscription.deactivate();
      }
    }

    const updated = await this.subscriptionRepository.update(id, existingSubscription);

    if (!updated) {
      throw new NotFoundException(`Failed to update subscription with id ${id}`);
    }

    return updated;
  }
}
