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
    if (dto.contractId !== undefined) {
      existingSubscription.updateContractId(dto.contractId);
    }

    if (dto.categoryId !== undefined) {
      existingSubscription.updateCategoryId(dto.categoryId);
    }

    if (dto.name !== undefined) {
      existingSubscription.updateName(dto.name);
    }

    if (dto.amount !== undefined) {
      existingSubscription.updateAmount(dto.amount);
    }

    if (dto.currency !== undefined) {
      existingSubscription.updateCurrency(dto.currency);
    }

    if (dto.frequency !== undefined) {
      existingSubscription.updateFrequency(dto.frequency);
    }

    if (dto.startDate !== undefined || dto.nextDueDate !== undefined) {
      const newStartDate = dto.startDate ?? existingSubscription.startDate;
      const newNextDueDate = dto.nextDueDate ?? existingSubscription.nextDueDate;
      existingSubscription.updateDates(newStartDate, newNextDueDate);
    }

    if (dto.trialStartDate !== undefined || dto.trialEndDate !== undefined) {
      const newTrialStartDate = dto.trialStartDate ?? existingSubscription.trialStartDate;
      const newTrialEndDate = dto.trialEndDate ?? existingSubscription.trialEndDate;
      existingSubscription.updateTrialDates(newTrialStartDate, newTrialEndDate);
    }

    if (dto.status !== undefined) {
      existingSubscription.updateStatus(dto.status);
    }

    if (dto.color !== undefined) {
      existingSubscription.updateColor(dto.color);
    }

    if (dto.notes !== undefined) {
      existingSubscription.updateNotes(dto.notes);
    }

    const updated = await this.subscriptionRepository.update(id, existingSubscription);

    if (!updated) {
      throw new NotFoundException(`Failed to update subscription with id ${id}`);
    }

    return updated;
  }
}
