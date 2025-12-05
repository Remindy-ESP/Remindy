import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import type { Event } from '../../domain/event.entity';

@Injectable()
export class GetEventByIdUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(id: string): Promise<Event> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }
}
