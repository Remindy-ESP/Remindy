import { Injectable, Inject } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionAppDto } from '../dto/create-subscription-app.dto';
import { SubscriptionEventGeneratorService } from '../services/subscription-event-generator.service';

export interface CreateSubscriptionResult {
  subscription: Subscription;
  eventsGenerated: number;
}

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventGeneratorService: SubscriptionEventGeneratorService,
  ) {}

  async execute(dto: CreateSubscriptionAppDto): Promise<CreateSubscriptionResult> {
    const subscription = new Subscription({
      userId: dto.userId,
      contractId: dto.contractId,
      categoryId: dto.categoryId,
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

    // Créer la subscription
    const createdSubscription = await this.subscriptionRepository.create(subscription);

    // Générer les événements si demandé (par défaut: true)
    let eventsGenerated = 0;
    if (dto.generateEvents !== false) {
      const count = dto.eventsToGenerate ?? 12;
      const events = await this.eventGeneratorService.generateEventsForSubscription({
        subscription: createdSubscription,
        count,
        timezone: dto.timezone,
      });
      eventsGenerated = events.length;
    }

    return {
      subscription: createdSubscription,
      eventsGenerated,
    };
  }
}
