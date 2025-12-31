import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { SubscriptionFilterDto } from '../dto/subscription-filter.dto';
import { CreateSubscriptionAppDto } from '../../application/dto/create-subscription-app.dto';
import { UpdateSubscriptionAppDto } from '../../application/dto/update-subscription-app.dto';
import { SubscriptionFilterAppDto } from '../../application/dto/subscription-filter-app.dto';

export class SubscriptionPresentationMapper {
  static toCreateAppDto(dto: CreateSubscriptionDto): CreateSubscriptionAppDto {
    // userId is required - should be injected by controller from JWT token
    if (!dto.userId) {
      throw new Error('userId is required for creating subscriptions');
    }

    const startDate = new Date(dto.startDate);
    const nextDueDate = dto.nextDueDate
      ? new Date(dto.nextDueDate)
      : this.calculateNextDueDate(startDate, dto.frequency);

    return {
      userId: dto.userId,
      contractId: dto.contractId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency ?? 'EUR',
      frequency: dto.frequency,
      startDate,
      nextDueDate,
      trialStartDate: dto.trialStartDate ? new Date(dto.trialStartDate) : undefined,
      trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : undefined,
      status: dto.status ?? 'active',
      color: dto.color,
      notes: dto.notes,
      generateEvents: dto.generateEvents ?? true,
      eventsToGenerate: dto.eventsToGenerate ?? 12,
      timezone: dto.timezone ?? 'Europe/Paris',
    };
  }

  static toUpdateAppDto(dto: UpdateSubscriptionDto): UpdateSubscriptionAppDto {
    return {
      contractId: dto.contractId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency,
      frequency: dto.frequency,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
      trialStartDate: dto.trialStartDate ? new Date(dto.trialStartDate) : undefined,
      trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : undefined,
      status: dto.status,
      color: dto.color,
      notes: dto.notes,
    };
  }

  static toFilterAppDto(dto: SubscriptionFilterDto): SubscriptionFilterAppDto {
    return {
      userId: dto.userId,
      contractId: dto.contractId,
      name: dto.name,
      currency: dto.currency,
      frequency: dto.frequency,
      status: dto.status,
    };
  }

  static toResponseDto(subscription: Subscription): SubscriptionResponseDto {
    const response = new SubscriptionResponseDto();
    response.id = subscription.id!;
    response.userId = subscription.userId;
    response.contractId = subscription.contractId;
    response.name = subscription.name;
    response.amount = subscription.amount;
    response.currency = subscription.currency;
    response.frequency = subscription.frequency;
    response.startDate = subscription.startDate;
    response.nextDueDate = subscription.nextDueDate;
    response.trialStartDate = subscription.trialStartDate;
    response.trialEndDate = subscription.trialEndDate;
    response.isTrialActive = subscription.isTrialActive;
    response.status = subscription.status;
    response.color = subscription.color;
    response.notes = subscription.notes;
    response.createdAt = subscription.createdAt!;
    response.updatedAt = subscription.updatedAt!;
    return response;
  }

  static toResponseDtoArray(subscriptions: Subscription[]): SubscriptionResponseDto[] {
    return subscriptions.map(subscription => this.toResponseDto(subscription));
  }

  private static calculateNextDueDate(
    startDate: Date,
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  ): Date {
    const date = new Date(startDate);
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date;
  }
}
