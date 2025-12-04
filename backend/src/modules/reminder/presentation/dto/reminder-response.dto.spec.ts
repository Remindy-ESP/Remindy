import { ReminderResponseDto } from './reminder-response.dto';

describe('ReminderResponseDto', () => {
  it('should create a response DTO with all fields', () => {
    const dto: ReminderResponseDto = {
      id: 'reminder-123',
      user_id: 'user-123',
      subscription_id: 'sub-123',
      type: 'payment_due',
      days_before: 3,
      enabled: true,
      channel: 'email',
      created_at: '2025-01-01T10:00:00.000Z',
      updated_at: '2025-01-02T10:00:00.000Z',
    };

    expect(dto.id).toBe('reminder-123');
    expect(dto.type).toBe('payment_due');
    expect(dto.days_before).toBe(3);
  });

  it('should create a response DTO without optional fields', () => {
    const dto: ReminderResponseDto = {
      id: 'reminder-456',
      user_id: 'user-456',
      type: 'budget_alert',
      days_before: 5,
      enabled: true,
      channel: 'push',
      created_at: '2025-01-01T10:00:00.000Z',
      updated_at: '2025-01-02T10:00:00.000Z',
    };

    expect(dto.subscription_id).toBeUndefined();
    expect(dto.deleted_at).toBeUndefined();
  });
});
