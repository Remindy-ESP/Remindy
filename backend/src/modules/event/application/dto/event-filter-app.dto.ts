export interface EventFilterAppDto {
  start?: Date;
  end?: Date;
  subscriptionId?: string;
  status?: 'scheduled' | 'completed' | 'canceled' | 'failed';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  limit?: number;
  sort?: 'starts_at:asc' | 'starts_at:desc' | 'amount:asc' | 'amount:desc';
}
