import { Injectable, Inject } from '@nestjs/common';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { ReminderFilterAppDto } from '../dto/reminder-filter-app.dto';

@Injectable()
export class FindAllRemindersUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
  ) {}

  async execute(filters: ReminderFilterAppDto): Promise<Reminder[]> {
    return await this.reminderRepository.findAll(filters);
  }
}
