import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import type { Event } from '../../domain/event.entity';
import type { EventStatus } from '../../domain/event.entity';

@Injectable()
export class UpdateEventStatusUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(id: string, status: EventStatus): Promise<Event> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(event.status, status);

    // Update event status using domain method
    event.updateStatus(status);

    const updatedEvent = await this.repository.update(id, event);

    if (!updatedEvent) {
      throw new NotFoundException(`Failed to update event with ID ${id}`);
    }

    return updatedEvent;
  }

  private validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
    // Define valid status transitions
    const validTransitions: Record<EventStatus, EventStatus[]> = {
      scheduled: ['completed', 'canceled', 'failed'],
      completed: [], // Cannot transition from completed
      canceled: [], // Cannot transition from canceled
      failed: ['scheduled'], // Can reschedule a failed event
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from '${currentStatus}' to '${newStatus}'`);
    }
  }
}
