import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/event.entity';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';

export interface GenerateEventsForSubscriptionDto {
  subscriptionId: string;
  subscriptionName: string;
  subscriptionAmount: number;
  eventSeriesId: string;
  occurrences: Array<{ startsAt: Date }>;
}

@Injectable()
export class GenerateEventsForSubscriptionUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(dto: GenerateEventsForSubscriptionDto): Promise<Event[]> {
    // Check existing events to avoid duplicates
    const existingEvents = await this.repository.findBySubscriptionId(dto.subscriptionId);
    const existingDates = new Set(
      existingEvents.map((e) => e.startsAt.toISOString().split('T')[0]),
    );

    // Filter out occurrences that already have events
    const newOccurrences = dto.occurrences.filter((occ) => {
      const dateKey = occ.startsAt.toISOString().split('T')[0];
      return !existingDates.has(dateKey);
    });

    if (newOccurrences.length === 0) {
      return [];
    }

    // Create new events
    const events = newOccurrences.map(
      (occ) =>
        new Event({
          subscriptionId: dto.subscriptionId,
          eventSeriesId: dto.eventSeriesId,
          title: `Paiement ${dto.subscriptionName}`,
          amount: dto.subscriptionAmount,
          startsAt: occ.startsAt,
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
    );

    return await this.repository.createMany(events);
  }
}
