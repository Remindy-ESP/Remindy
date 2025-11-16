import { ReminderType, ReminderChannel } from '../../domain/reminder.entity';

export interface UpdateReminderAppDto {
  subscriptionId?: string;
  type?: ReminderType;
  daysBefore?: number;
  enabled?: boolean;
  channel?: ReminderChannel;
}
