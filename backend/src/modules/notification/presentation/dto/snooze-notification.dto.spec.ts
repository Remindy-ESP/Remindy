import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SnoozeNotificationDto } from './snooze-notification.dto';

describe('SnoozeNotificationDto', () => {
  it('should validate a valid snooze DTO', async () => {
    const dto = plainToClass(SnoozeNotificationDto, {
      snoozed_until: '2025-02-01T10:00:00.000Z',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if snoozed_until is missing', async () => {
    const dto = plainToClass(SnoozeNotificationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
