import { Reminder } from '../../domain/reminder.entity';
import { ReminderFilterAppDto } from '../dto/reminder-filter-app.dto';

export interface IReminderRepository {
  findById(id: string): Promise<Reminder | null>;
  findAll(filters: ReminderFilterAppDto): Promise<Reminder[]>;
  findByUserIdAndType(userId: string, type: string): Promise<Reminder[]>;
  save(reminder: Reminder): Promise<Reminder>;
  update(id: string, reminder: Reminder): Promise<Reminder | null>;
  delete(id: string): Promise<void>;
}

export const REMINDER_REPOSITORY = Symbol('IReminderRepository');
