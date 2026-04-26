import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { RescheduleEventAppDto } from '../dto/reschedule-event-app.dto';

@Injectable()
export class RescheduleEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(id: string, dto: RescheduleEventAppDto): Promise<Event> {
    const existingEvent = await this.eventRepository.findById(id);

    if (!existingEvent) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // Reschedule the event
    existingEvent.reschedule(dto.startsAt, dto.endsAt);

    // Update notes if provided
    if (dto.notes !== undefined) {
      existingEvent.updateNotes(dto.notes);
    }

    const updated = await this.eventRepository.update(id, existingEvent);

    if (!updated) {
      throw new NotFoundException(`Failed to reschedule event with id ${id}`);
    }

    return updated;
  }
}
