import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';

@Injectable()
export class FindReminderByIdUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Reminder> {
    // Verify reminder exists and belongs to user
    const reminder = await this.reminderRepository.findById(id);

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    if (reminder.userId !== userId) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    return reminder;
  }
}
