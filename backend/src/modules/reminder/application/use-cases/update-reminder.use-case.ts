import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { UpdateReminderAppDto } from '../dto/update-reminder-app.dto';

@Injectable()
export class UpdateReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
  ) {}

  async execute(id: string, userId: string, dto: UpdateReminderAppDto): Promise<Reminder> {
    // Verify reminder exists and belongs to user
    const reminder = await this.reminderRepository.findById(id);

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    if (reminder.userId !== userId) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    try {
      // Update fields using domain methods
      if (dto.daysBefore !== undefined) {
        reminder.updateDaysBefore(dto.daysBefore);
      }

      if (dto.channel !== undefined) {
        reminder.updateChannel(dto.channel);
      }

      if (dto.enabled !== undefined) {
        if (dto.enabled) {
          reminder.enable();
        } else {
          reminder.disable();
        }
      }

      // Note: type and subscriptionId are not updated as they define the reminder's identity

      // Update reminder
      const updated = await this.reminderRepository.update(id, reminder);

      if (!updated) {
        throw new NotFoundException(`Failed to update reminder with ID ${id}`);
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
