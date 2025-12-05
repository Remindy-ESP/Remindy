import { NotificationResponseDto } from './notification-response.dto';

describe('NotificationResponseDto', () => {
  it('should create a response DTO', () => {
    const dto: NotificationResponseDto = {
      id: 'notif-123',
      user_id: 'user-123',
      type: 'payment_due',
      channel: 'email',
      title: 'Payment Due',
      body: 'Your payment is due',
      status: 'sent',
      created_at: '2025-01-01T10:00:00.000Z',
    };

    expect(dto.id).toBe('notif-123');
    expect(dto.status).toBe('sent');
  });
});
