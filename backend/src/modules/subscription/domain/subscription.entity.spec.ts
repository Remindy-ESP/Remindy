import { Subscription } from './subscription.entity';

function makeValidProps(overrides = {}) {
  return {
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    currency: 'EUR',
    frequency: 'monthly' as const,
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    status: 'active' as const,
    ...overrides,
  };
}

describe('Subscription domain entity', () => {
  describe('constructor & validate', () => {
    it('creates a valid subscription with all fields', () => {
      const s = new Subscription(
        makeValidProps({
          id: 'sub-1',
          contractId: 42,
          categoryId: 'cat-1',
          endDate: new Date('2026-01-01'),
          trialStartDate: new Date('2025-01-01'),
          trialEndDate: new Date('2025-01-31'),
          color: '#FF5733',
          notes: 'Some notes',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
        }),
      );
      expect(s.id).toBe('sub-1');
      expect(s.userId).toBe('user-1');
      expect(s.contractId).toBe(42);
      expect(s.categoryId).toBe('cat-1');
      expect(s.name).toBe('Netflix');
      expect(s.amount).toBe(9.99);
      expect(s.currency).toBe('EUR');
      expect(s.frequency).toBe('monthly');
      expect(s.color).toBe('#FF5733');
      expect(s.notes).toBe('Some notes');
      expect(s.createdAt).toBeDefined();
      expect(s.updatedAt).toBeDefined();
      expect(s.deletedAt).toBeDefined();
    });

    it('throws when name is empty', () => {
      expect(() => new Subscription(makeValidProps({ name: '' }))).toThrow(
        'Subscription name cannot be empty',
      );
    });

    it('throws when name is whitespace only', () => {
      expect(() => new Subscription(makeValidProps({ name: '   ' }))).toThrow(
        'Subscription name cannot be empty',
      );
    });

    it('throws when name exceeds 255 characters', () => {
      expect(() => new Subscription(makeValidProps({ name: 'a'.repeat(256) }))).toThrow(
        'Subscription name cannot exceed 255 characters',
      );
    });

    it('throws when amount is negative', () => {
      expect(() => new Subscription(makeValidProps({ amount: -1 }))).toThrow(
        'Subscription amount cannot be negative',
      );
    });

    it('allows amount of zero', () => {
      expect(() => new Subscription(makeValidProps({ amount: 0 }))).not.toThrow();
    });

    it('throws when currency is empty', () => {
      expect(() => new Subscription(makeValidProps({ currency: '' }))).toThrow(
        'Currency cannot be empty',
      );
    });

    it('throws when currency is not 3 chars', () => {
      expect(() => new Subscription(makeValidProps({ currency: 'EU' }))).toThrow(
        'Currency must be a valid ISO 4217 code (3 characters)',
      );
    });

    it('throws when frequency is invalid', () => {
      expect(() => new Subscription(makeValidProps({ frequency: 'daily' as any }))).toThrow(
        'Invalid frequency',
      );
    });

    it('throws when status is invalid', () => {
      expect(() => new Subscription(makeValidProps({ status: 'unknown' as any }))).toThrow(
        'Invalid status',
      );
    });

    it('throws when trial end date is before trial start date', () => {
      expect(
        () =>
          new Subscription(
            makeValidProps({
              trialStartDate: new Date('2025-02-01'),
              trialEndDate: new Date('2025-01-01'),
            }),
          ),
      ).toThrow('Trial end date must be after trial start date');
    });

    it('throws when end date is before start date', () => {
      expect(
        () =>
          new Subscription(
            makeValidProps({
              startDate: new Date('2025-06-01'),
              nextDueDate: new Date('2025-07-01'),
              endDate: new Date('2025-05-01'),
            }),
          ),
      ).toThrow('End date must be after start date');
    });

    it('throws when color is invalid HEX', () => {
      expect(() => new Subscription(makeValidProps({ color: 'red' }))).toThrow(
        'Color must be a valid HEX color code',
      );
    });

    it('accepts valid lowercase hex color', () => {
      expect(() => new Subscription(makeValidProps({ color: '#aabbcc' }))).not.toThrow();
    });

    it('accepts all valid frequencies', () => {
      for (const freq of ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'] as const) {
        expect(() => new Subscription(makeValidProps({ frequency: freq }))).not.toThrow();
      }
    });

    it('accepts all valid statuses', () => {
      for (const status of ['active', 'paused', 'cancelled', 'trial'] as const) {
        expect(() => new Subscription(makeValidProps({ status }))).not.toThrow();
      }
    });
  });

  describe('updateName', () => {
    it('updates the name', () => {
      const s = new Subscription(makeValidProps());
      s.updateName('Disney+');
      expect(s.name).toBe('Disney+');
    });

    it('trims whitespace', () => {
      const s = new Subscription(makeValidProps());
      s.updateName('  Spotify  ');
      expect(s.name).toBe('Spotify');
    });

    it('throws on empty name', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateName('')).toThrow('Subscription name cannot be empty');
    });

    it('throws when name exceeds 255 characters', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateName('a'.repeat(256))).toThrow(
        'Subscription name cannot exceed 255 characters',
      );
    });
  });

  describe('updateAmount', () => {
    it('updates amount', () => {
      const s = new Subscription(makeValidProps());
      s.updateAmount(19.99);
      expect(s.amount).toBe(19.99);
    });

    it('throws on negative amount', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateAmount(-5)).toThrow('Subscription amount cannot be negative');
    });
  });

  describe('updateCurrency', () => {
    it('uppercases and updates currency', () => {
      const s = new Subscription(makeValidProps());
      s.updateCurrency('usd');
      expect(s.currency).toBe('USD');
    });

    it('throws on empty currency', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateCurrency('')).toThrow('Currency cannot be empty');
    });

    it('throws when currency length is not 3', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateCurrency('EURO')).toThrow(
        'Currency must be a valid ISO 4217 code (3 characters)',
      );
    });
  });

  describe('updateFrequency', () => {
    it('updates frequency and recalculates next due date', () => {
      const s = new Subscription(
        makeValidProps({ startDate: new Date('2025-01-01'), nextDueDate: new Date('2025-02-01') }),
      );
      s.updateFrequency('yearly');
      expect(s.frequency).toBe('yearly');
      expect(s.nextDueDate.getFullYear()).toBe(2026);
    });

    it('recalculates for weekly', () => {
      const s = new Subscription(makeValidProps({ startDate: new Date('2025-01-01') }));
      s.updateFrequency('weekly');
      expect(s.nextDueDate.getDate()).toBe(8);
    });

    it('recalculates for quarterly', () => {
      const s = new Subscription(makeValidProps({ startDate: new Date('2025-01-01') }));
      s.updateFrequency('quarterly');
      expect(s.nextDueDate.getMonth()).toBe(3); // April
    });

    it('recalculates for one-time (same as startDate)', () => {
      const s = new Subscription(makeValidProps({ startDate: new Date('2025-03-01') }));
      s.updateFrequency('one-time');
      expect(s.nextDueDate.getTime()).toBe(new Date('2025-03-01').getTime());
    });

    it('recalculates for monthly', () => {
      const s = new Subscription(
        makeValidProps({ startDate: new Date('2025-01-01'), frequency: 'yearly' }),
      );
      s.updateFrequency('monthly');
      expect(s.nextDueDate.getMonth()).toBe(1); // February
    });

    it('throws on invalid frequency', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateFrequency('biweekly' as any)).toThrow('Invalid frequency');
    });
  });

  describe('updateDates', () => {
    it('updates dates', () => {
      const s = new Subscription(makeValidProps());
      const start = new Date('2025-03-01');
      const next = new Date('2025-04-01');
      s.updateDates(start, next);
      expect(s.startDate).toBe(start);
      expect(s.nextDueDate).toBe(next);
      expect(s.endDate).toBeUndefined();
    });

    it('sets endDate when provided', () => {
      const s = new Subscription(makeValidProps());
      const end = new Date('2026-01-01');
      s.updateDates(new Date('2025-01-01'), new Date('2025-02-01'), end);
      expect(s.endDate).toBe(end);
    });

    it('throws when nextDueDate is before startDate', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateDates(new Date('2025-06-01'), new Date('2025-05-01'))).toThrow(
        'Next due date must be on or after start date',
      );
    });

    it('allows nextDueDate equal to startDate (one-time subscriptions)', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateDates(new Date('2025-05-15'), new Date('2025-05-15'))).not.toThrow();
    });

    it('throws when endDate is before startDate', () => {
      const s = new Subscription(makeValidProps());
      expect(() =>
        s.updateDates(new Date('2025-06-01'), new Date('2025-07-01'), new Date('2025-05-01')),
      ).toThrow('End date must be on or after start date');
    });
  });

  describe('updateTrialDates', () => {
    it('updates trial dates', () => {
      const s = new Subscription(makeValidProps());
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');
      s.updateTrialDates(start, end);
      expect(s.trialStartDate).toBe(start);
      expect(s.trialEndDate).toBe(end);
    });

    it('clears trial dates when called with undefined', () => {
      const s = new Subscription(makeValidProps());
      s.updateTrialDates(undefined, undefined);
      expect(s.trialStartDate).toBeUndefined();
      expect(s.trialEndDate).toBeUndefined();
    });

    it('throws when trialEndDate is before trialStartDate', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateTrialDates(new Date('2025-02-01'), new Date('2025-01-01'))).toThrow(
        'Trial end date must be after trial start date',
      );
    });
  });

  describe('updateStatus', () => {
    it('updates to valid status', () => {
      const s = new Subscription(makeValidProps());
      s.updateStatus('paused');
      expect(s.status).toBe('paused');
    });

    it('throws on invalid status', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateStatus('archived' as any)).toThrow('Invalid status');
    });
  });

  describe('updateColor', () => {
    it('updates color', () => {
      const s = new Subscription(makeValidProps());
      s.updateColor('#123456');
      expect(s.color).toBe('#123456');
    });

    it('clears color when called with undefined', () => {
      const s = new Subscription(makeValidProps({ color: '#123456' }));
      s.updateColor(undefined);
      expect(s.color).toBeUndefined();
    });

    it('throws on invalid HEX', () => {
      const s = new Subscription(makeValidProps());
      expect(() => s.updateColor('#ZZZZZZ')).toThrow('Color must be a valid HEX color code');
    });
  });

  describe('updateNotes', () => {
    it('trims and updates notes', () => {
      const s = new Subscription(makeValidProps());
      s.updateNotes('  hello  ');
      expect(s.notes).toBe('hello');
    });

    it('clears notes when undefined', () => {
      const s = new Subscription(makeValidProps({ notes: 'old' }));
      s.updateNotes(undefined);
      expect(s.notes).toBeUndefined();
    });
  });

  describe('updateContractId & updateCategoryId', () => {
    it('updates contractId', () => {
      const s = new Subscription(makeValidProps());
      s.updateContractId(99);
      expect(s.contractId).toBe(99);
    });

    it('clears contractId', () => {
      const s = new Subscription(makeValidProps({ contractId: 5 }));
      s.updateContractId(undefined);
      expect(s.contractId).toBeUndefined();
    });

    it('updates categoryId', () => {
      const s = new Subscription(makeValidProps());
      s.updateCategoryId('cat-99');
      expect(s.categoryId).toBe('cat-99');
    });

    it('clears categoryId', () => {
      const s = new Subscription(makeValidProps({ categoryId: 'cat-1' }));
      s.updateCategoryId(undefined);
      expect(s.categoryId).toBeUndefined();
    });
  });

  describe('status shortcuts', () => {
    it('pause sets status to paused', () => {
      const s = new Subscription(makeValidProps());
      s.pause();
      expect(s.status).toBe('paused');
    });

    it('cancel sets status to cancelled', () => {
      const s = new Subscription(makeValidProps());
      s.cancel();
      expect(s.status).toBe('cancelled');
    });

    it('activate sets status to active', () => {
      const s = new Subscription(makeValidProps({ status: 'paused' }));
      s.activate();
      expect(s.status).toBe('active');
    });

    it('startTrial sets status to trial', () => {
      const s = new Subscription(makeValidProps());
      s.startTrial();
      expect(s.status).toBe('trial');
    });
  });

  describe('isExpired', () => {
    it('returns true when status is cancelled', () => {
      const s = new Subscription(makeValidProps({ status: 'cancelled' }));
      expect(s.isExpired()).toBe(true);
    });

    it('returns false for other statuses', () => {
      for (const status of ['active', 'paused', 'trial'] as const) {
        const s = new Subscription(makeValidProps({ status }));
        expect(s.isExpired()).toBe(false);
      }
    });
  });

  describe('isInTrial', () => {
    it('returns false when no trialEndDate', () => {
      const s = new Subscription(makeValidProps());
      expect(s.isInTrial()).toBe(false);
    });

    it('returns true when trialEndDate is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const s = new Subscription(
        makeValidProps({ trialStartDate: new Date('2025-01-01'), trialEndDate: future }),
      );
      expect(s.isInTrial()).toBe(true);
    });

    it('returns false when trialEndDate is in the past', () => {
      const s = new Subscription(
        makeValidProps({
          trialStartDate: new Date('2020-01-01'),
          trialEndDate: new Date('2020-06-01'),
        }),
      );
      expect(s.isInTrial()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns all props', () => {
      const props = makeValidProps({ id: 'sub-json', notes: 'note' });
      const s = new Subscription(props);
      const json = s.toJSON();
      expect(json.id).toBe('sub-json');
      expect(json.userId).toBe('user-1');
      expect(json.name).toBe('Netflix');
      expect(json.notes).toBe('note');
      expect(json.frequency).toBe('monthly');
    });
  });
});
