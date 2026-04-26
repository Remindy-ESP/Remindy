export interface NotificationFilterAppDto {
  userId: string;
  type?: string;
  channel?: string;
  status?: string;
  isRead?: boolean;
  limit?: number;
  sort?: string;
}
