import { Injectable, Inject } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { EventFilterAppDto } from '../dto/event-filter-app.dto';

@Injectable()
export class FindAllEventsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(filters?: EventFilterAppDto): Promise<Event[]> {
    return await this.eventRepository.findAll(filters);
  }
}
