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
    return {
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      periodType: dto.periodType,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive ?? true,
    };
  }

  static toUpdateAppDto(dto: UpdateSubscriptionDto): UpdateSubscriptionAppDto {
    return {
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      periodType: dto.periodType,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive,
    };
  }

  static toFilterAppDto(dto: SubscriptionFilterDto): SubscriptionFilterAppDto {
    return {
      userId: dto.userId,
      name: dto.name,
      currency: dto.currency,
      periodType: dto.periodType,
      isActive: dto.isActive,
    };
  }

  static toResponseDto(subscription: Subscription): SubscriptionResponseDto {
    const response = new SubscriptionResponseDto();
    response.id = subscription.id!;
    response.userId = subscription.userId;
    response.name = subscription.name;
    response.description = subscription.description;
    response.amount = subscription.amount;
    response.currency = subscription.currency;
    response.periodType = subscription.periodType;
    response.startDate = subscription.startDate;
    response.endDate = subscription.endDate;
    response.isActive = subscription.isActive;
    response.createdAt = subscription.createdAt!;
    response.updatedAt = subscription.updatedAt!;
    return response;
  }

  static toResponseDtoArray(subscriptions: Subscription[]): SubscriptionResponseDto[] {
    return subscriptions.map(subscription => this.toResponseDto(subscription));
  }
}
