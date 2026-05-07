import { Reminder, ReminderProps } from './reminder.entity';

describe('Reminder Entity', () => {
  const validProps: ReminderProps = {
    userId: 'user-123',
    type: 'subscription_renewal',
    daysBefore: 7,
    enabled: true,
    channel: 'email',
  };

  describe('constructor / validation', () => {
    it('should create a valid reminder', () => {
      const reminder = new Reminder(validProps);

      expect(reminder.userId).toBe('user-123');
      expect(reminder.type).toBe('subscription_renewal');
      expect(reminder.daysBefore).toBe(7);
      expect(reminder.enabled).toBe(true);
      expect(reminder.channel).toBe('email');
    });

    it('should accept optional fields', () => {
      const now = new Date();
      const props: ReminderProps = {
        ...validProps,
        id: 'rem-1',
        subscriptionId: 'sub-123',
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      };

      const reminder = new Reminder(props);

      expect(reminder.id).toBe('rem-1');
      expect(reminder.subscriptionId).toBe('sub-123');
      expect(reminder.createdAt).toBe(now);
      expect(reminder.updatedAt).toBe(now);
      expect(reminder.deletedAt).toBe(now);
    });

    it('should throw when userId is empty', () => {
      expect(() => new Reminder({ ...validProps, userId: '' })).toThrow('User ID cannot be empty');
    });

    it('should throw when userId is only whitespace', () => {
      expect(() => new Reminder({ ...validProps, userId: '   ' })).toThrow(
        'User ID cannot be empty',
      );
    });

    it('should throw when daysBefore is 0', () => {
      expect(() => new Reminder({ ...validProps, daysBefore: 0 })).toThrow(
        'Days before must be greater than 0',
      );
    });

    it('should throw when daysBefore is negative', () => {
      expect(() => new Reminder({ ...validProps, daysBefore: -1 })).toThrow(
        'Days before must be greater than 0',
      );
    });

    it('should throw when daysBefore exceeds 365', () => {
      expect(() => new Reminder({ ...validProps, daysBefore: 366 })).toThrow(
        'Days before cannot exceed 365 days',
      );
    });

    it('should accept daysBefore = 365 (max)', () => {
      const reminder = new Reminder({ ...validProps, daysBefore: 365 });
      expect(reminder.daysBefore).toBe(365);
    });

    it('should throw for invalid reminder type', () => {
      expect(() => new Reminder({ ...validProps, type: 'invalid_type' as any })).toThrow(
        'Invalid reminder type',
      );
    });

    it('should accept all valid types', () => {
      const validTypes = [
        'subscription_renewal',
        'trial_ending',
        'payment_due',
        'payment_failed',
        'budget_alert',
      ] as const;

      validTypes.forEach(type => {
        expect(() => new Reminder({ ...validProps, type })).not.toThrow();
      });
    });

    it('should throw for invalid channel', () => {
      expect(() => new Reminder({ ...validProps, channel: 'invalid_channel' as any })).toThrow(
        'Invalid reminder channel',
      );
    });

    it('should accept all valid channels', () => {
      const validChannels = ['email', 'push', 'sms'] as const;

      validChannels.forEach(channel => {
        const reminder = new Reminder({ ...validProps, channel });
        expect(reminder.channel).toBe(channel);
      });
    });
  });

  describe('enable / disable', () => {
    it('should enable a disabled reminder', () => {
      const reminder = new Reminder({ ...validProps, enabled: false });
      reminder.enable();
      expect(reminder.enabled).toBe(true);
    });

    it('should disable an enabled reminder', () => {
      const reminder = new Reminder({ ...validProps, enabled: true });
      reminder.disable();
      expect(reminder.enabled).toBe(false);
    });
  });

  describe('updateDaysBefore', () => {
    it('should update daysBefore to a valid value', () => {
      const reminder = new Reminder(validProps);
      reminder.updateDaysBefore(14);
      expect(reminder.daysBefore).toBe(14);
    });

    it('should throw when new daysBefore is 0', () => {
      const reminder = new Reminder(validProps);
      expect(() => reminder.updateDaysBefore(0)).toThrow('Days before must be greater than 0');
    });

    it('should throw when new daysBefore is negative', () => {
      const reminder = new Reminder(validProps);
      expect(() => reminder.updateDaysBefore(-5)).toThrow('Days before must be greater than 0');
    });

    it('should throw when new daysBefore exceeds 365', () => {
      const reminder = new Reminder(validProps);
      expect(() => reminder.updateDaysBefore(400)).toThrow('Days before cannot exceed 365 days');
    });
  });

  describe('updateChannel', () => {
    it('should update channel to valid value', () => {
      const reminder = new Reminder(validProps);
      reminder.updateChannel('push');
      expect(reminder.channel).toBe('push');
    });

    it('should update channel to sms', () => {
      const reminder = new Reminder(validProps);
      reminder.updateChannel('sms');
      expect(reminder.channel).toBe('sms');
    });

    it('should throw for invalid channel', () => {
      const reminder = new Reminder(validProps);
      expect(() => reminder.updateChannel('telegram' as any)).toThrow('Invalid reminder channel');
    });
  });

  describe('isGlobal', () => {
    it('should return true when subscriptionId is undefined', () => {
      const reminder = new Reminder({ ...validProps, subscriptionId: undefined });
      expect(reminder.isGlobal()).toBe(true);
    });

    it('should return false when subscriptionId is set', () => {
      const reminder = new Reminder({ ...validProps, subscriptionId: 'sub-123' });
      expect(reminder.isGlobal()).toBe(false);
    });
  });

  describe('isForSubscription', () => {
    it('should return true when subscriptionId matches', () => {
      const reminder = new Reminder({ ...validProps, subscriptionId: 'sub-123' });
      expect(reminder.isForSubscription('sub-123')).toBe(true);
    });

    it('should return false when subscriptionId does not match', () => {
      const reminder = new Reminder({ ...validProps, subscriptionId: 'sub-123' });
      expect(reminder.isForSubscription('sub-999')).toBe(false);
    });

    it('should return false when subscriptionId is undefined', () => {
      const reminder = new Reminder({ ...validProps, subscriptionId: undefined });
      expect(reminder.isForSubscription('sub-123')).toBe(false);
    });
  });
});
