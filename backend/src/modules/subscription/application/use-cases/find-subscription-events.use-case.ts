import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import { Event } from '../../../event/domain/event.entity';

// We'll use the Event type from event module
export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventSeriesId?: string;
  title: string;
  amount: number;
  startsAt: Date;
  endsAt?: Date;
  status: string;
  paymentStatus?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FindSubscriptionEventsUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(subscriptionId: string): Promise<SubscriptionEvent[]> {
    // Verify subscription exists
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${subscriptionId} not found`);
    }

    // Get all events for this subscription
    const events = await this.eventRepository.findBySubscriptionId(subscriptionId);

    return events.map(
      (event: Event): SubscriptionEvent => ({
        id: event.id!,
        subscriptionId: event.subscriptionId,
        eventSeriesId: event.eventSeriesId,
        title: event.title,
        amount: event.amount,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        status: event.status,
        paymentStatus: event.paymentStatus,
        notes: event.notes,
        createdAt: event.createdAt!,
        updatedAt: event.updatedAt!,
      }),
    );
  }
}
