import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import type { Event } from '../../domain/event.entity';
import type { PaymentStatus } from '../../domain/event.entity';

@Injectable()
export class UpdateEventPaymentStatusUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(id: string, paymentStatus: PaymentStatus): Promise<Event> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Update event payment status using domain method
    event.updatePaymentStatus(paymentStatus);

    const updatedEvent = await this.repository.update(id, event);

    if (!updatedEvent) {
      throw new NotFoundException(`Failed to update event with ID ${id}`);
    }

    return updatedEvent;
  }
}
