import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateReminderDto } from './create-reminder.dto';

describe('CreateReminderDto', () => {
  describe('validation', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 3,
        enabled: true,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with optional subscription_id', async () => {
      const dto = plainToClass(CreateReminderDto, {
        subscription_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'payment_due',
        days_before: 3,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if type is missing', async () => {
      const dto = plainToClass(CreateReminderDto, {
        days_before: 3,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });

    it('should fail if type is invalid', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'invalid_type',
        days_before: 3,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });

    it('should validate all valid types', async () => {
      const types = [
        'subscription_renewal',
        'trial_ending',
        'payment_due',
        'payment_failed',
        'budget_alert',
      ];

      for (const type of types) {
        const dto = plainToClass(CreateReminderDto, {
          type,
          days_before: 3,
          channel: 'email',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should fail if days_before is missing', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const daysBeforeError = errors.find(e => e.property === 'days_before');
      expect(daysBeforeError).toBeDefined();
    });

    it('should fail if days_before is less than 1', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 0,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const daysBeforeError = errors.find(e => e.property === 'days_before');
      expect(daysBeforeError).toBeDefined();
    });

    it('should fail if days_before is greater than 365', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 366,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const daysBeforeError = errors.find(e => e.property === 'days_before');
      expect(daysBeforeError).toBeDefined();
    });

    it('should validate days_before at boundaries', async () => {
      const dto1 = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 1,
        channel: 'email',
      });

      const errors1 = await validate(dto1);
      expect(errors1.length).toBe(0);

      const dto2 = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 365,
        channel: 'email',
      });

      const errors2 = await validate(dto2);
      expect(errors2.length).toBe(0);
    });

    it('should fail if channel is missing', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 3,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('channel');
    });

    it('should fail if channel is invalid', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 3,
        channel: 'invalid_channel',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('channel');
    });

    it('should validate all valid channels', async () => {
      const channels = ['email', 'push', 'sms'];

      for (const channel of channels) {
        const dto = plainToClass(CreateReminderDto, {
          type: 'payment_due',
          days_before: 3,
          channel,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should accept enabled as optional boolean', async () => {
      const dto = plainToClass(CreateReminderDto, {
        type: 'payment_due',
        days_before: 3,
        channel: 'email',
        enabled: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if subscription_id is not a valid UUID', async () => {
      const dto = plainToClass(CreateReminderDto, {
        subscription_id: 'not-a-uuid',
        type: 'payment_due',
        days_before: 3,
        channel: 'email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const subIdError = errors.find(e => e.property === 'subscription_id');
      expect(subIdError).toBeDefined();
    });
  });
});
