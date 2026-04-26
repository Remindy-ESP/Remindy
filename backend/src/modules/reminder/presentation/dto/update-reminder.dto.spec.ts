import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateReminderDto } from './update-reminder.dto';

describe('UpdateReminderDto', () => {
  describe('validation', () => {
    it('should validate an empty DTO (all fields optional)', async () => {
      const dto = plainToClass(UpdateReminderDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with only days_before', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        days_before: 7,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with only enabled', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        enabled: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with only channel', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        channel: 'push',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with all fields', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        days_before: 14,
        enabled: true,
        channel: 'sms',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if days_before is less than 1', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        days_before: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if days_before is greater than 365', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        days_before: 366,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if channel is invalid', async () => {
      const dto = plainToClass(UpdateReminderDto, {
        channel: 'invalid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate all valid channels', async () => {
      const channels = ['email', 'push', 'sms'];

      for (const channel of channels) {
        const dto = plainToClass(UpdateReminderDto, {
          channel,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });
});
