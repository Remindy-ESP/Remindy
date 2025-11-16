import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';

@Injectable()
export class DeleteReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    // Verify reminder exists and belongs to user
    const reminder = await this.reminderRepository.findById(id);

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    if (reminder.userId !== userId) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    // Soft delete
    await this.reminderRepository.delete(id);
  }
}
