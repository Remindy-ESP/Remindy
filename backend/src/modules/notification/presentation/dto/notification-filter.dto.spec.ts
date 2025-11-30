import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { NotificationFilterDto } from './notification-filter.dto';

describe('NotificationFilterDto', () => {
  it('should validate an empty filter', async () => {
    const dto = plainToClass(NotificationFilterDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(NotificationFilterDto, {
      type: 'reminder',
      channel: 'email',
      status: 'sent',
      is_read: true,
      limit: 50,
      sort: 'created_at:desc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate all notification types', async () => {
    const types = [
      'reminder',
      'payment_overdue',
      'trial_ending',
      'subscription_renewed',
      'document_processed',
    ];
    for (const type of types) {
      const dto = plainToClass(NotificationFilterDto, { type });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});
