import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ReminderFilterDto } from './reminder-filter.dto';

describe('ReminderFilterDto', () => {
  it('should validate an empty filter (all fields optional)', async () => {
    const dto = plainToClass(ReminderFilterDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(ReminderFilterDto, {
      subscription_id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'payment_due',
      enabled: true,
      limit: 50,
      sort: 'created_at:desc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if subscription_id is not a valid UUID', async () => {
    const dto = plainToClass(ReminderFilterDto, {
      subscription_id: 'invalid-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate all valid reminder types', async () => {
    const types = [
      'subscription_renewal',
      'trial_ending',
      'payment_due',
      'payment_failed',
      'budget_alert',
    ];
    for (const type of types) {
      const dto = plainToClass(ReminderFilterDto, { type });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});
