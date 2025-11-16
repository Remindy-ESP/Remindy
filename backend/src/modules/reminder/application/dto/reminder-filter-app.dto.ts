export interface ReminderFilterAppDto {
  userId: string;
  subscriptionId?: string;
  type?: string;
  enabled?: boolean;
  limit?: number;
  sort?: string;
}
