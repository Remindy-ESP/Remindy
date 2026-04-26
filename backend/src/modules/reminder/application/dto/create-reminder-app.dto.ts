import { ReminderType, ReminderChannel } from '../../domain/reminder.entity';

export interface CreateReminderAppDto {
  userId: string;
  subscriptionId?: string;
  type: ReminderType;
  daysBefore: number;
  enabled: boolean;
  channel: ReminderChannel;
}
