import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';

@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.repository.delete(id);
  }
}
