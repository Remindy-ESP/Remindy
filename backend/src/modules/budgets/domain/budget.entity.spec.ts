import { Budget } from './budget.entity';

const validProps = {
  userId: 'user-1',
  name: 'Streaming',
  amount: 50,
  currency: 'EUR',
  period: 'monthly' as const,
  startDate: new Date('2026-01-01T00:00:00Z'),
};

describe('Budget domain entity', () => {
  describe('construction & validation', () => {
    it('builds a valid budget with sane defaults', () => {
      const b = new Budget(validProps);
      expect(b.userId).toBe('user-1');
      expect(b.isActive).toBe(true);
      expect(b.endDate).toBeNull();
      expect(b.categoryId).toBeNull();
    });

    it('rejects empty userId', () => {
      expect(() => new Budget({ ...validProps, userId: ' ' })).toThrow('Budget userId is required');
    });

    it('rejects empty name', () => {
      expect(() => new Budget({ ...validProps, name: '' })).toThrow('Budget name cannot be empty');
    });

    it('rejects name longer than 100 chars', () => {
      expect(() => new Budget({ ...validProps, name: 'x'.repeat(101) })).toThrow(
        'Budget name cannot exceed 100 characters',
      );
    });

    it('rejects non-positive amount', () => {
      expect(() => new Budget({ ...validProps, amount: 0 })).toThrow(
        'Budget amount must be greater than zero',
      );
      expect(() => new Budget({ ...validProps, amount: -1 })).toThrow(
        'Budget amount must be greater than zero',
      );
    });

    it('rejects invalid currency length', () => {
      expect(() => new Budget({ ...validProps, currency: 'EU' })).toThrow(
        'Currency must be a valid ISO 4217 code',
      );
    });

    it('rejects invalid period', () => {
      expect(
        () => new Budget({ ...validProps, period: 'weekly' as unknown as 'monthly' }),
      ).toThrow('Invalid period');
    });

    it('rejects an endDate before the startDate', () => {
      expect(
        () =>
          new Budget({ ...validProps, endDate: new Date('2025-12-01T00:00:00Z') }),
      ).toThrow('End date must be after start date');
    });
  });

  describe('updaters', () => {
    let budget: Budget;
    beforeEach(() => {
      budget = new Budget(validProps);
    });

    it('updateName trims and stores the new value', () => {
      budget.updateName('  New  ');
      expect(budget.name).toBe('New');
    });
    it('updateName rejects empty', () => {
      expect(() => budget.updateName('   ')).toThrow();
    });
    it('updateName rejects too long', () => {
      expect(() => budget.updateName('x'.repeat(101))).toThrow();
    });

    it('updateAmount stores positive amount', () => {
      budget.updateAmount(123.45);
      expect(budget.amount).toBe(123.45);
    });
    it('updateAmount rejects zero', () => {
      expect(() => budget.updateAmount(0)).toThrow();
    });

    it('updateCurrency uppercases', () => {
      budget.updateCurrency('usd');
      expect(budget.currency).toBe('USD');
    });
    it('updateCurrency rejects wrong length', () => {
      expect(() => budget.updateCurrency('EU')).toThrow();
    });

    it('updatePeriod accepts yearly', () => {
      budget.updatePeriod('yearly');
      expect(budget.period).toBe('yearly');
    });
    it('updatePeriod rejects invalid', () => {
      expect(() => budget.updatePeriod('weekly' as unknown as 'monthly')).toThrow();
    });

    it('updateCategoryId normalizes undefined to null', () => {
      budget.updateCategoryId();
      expect(budget.categoryId).toBeNull();
    });

    it('updateDates updates start and end together', () => {
      const start = new Date('2026-02-01T00:00:00Z');
      const end = new Date('2026-04-01T00:00:00Z');
      budget.updateDates(start, end);
      expect(budget.startDate).toEqual(start);
      expect(budget.endDate).toEqual(end);
    });
    it('updateDates rejects when end<=start', () => {
      expect(() => budget.updateDates(new Date('2026-02-01'), new Date('2026-01-01'))).toThrow();
    });

    it('updateNotes trims', () => {
      budget.updateNotes('  hello  ');
      expect(budget.notes).toBe('hello');
    });

    it('activate / deactivate', () => {
      budget.deactivate();
      expect(budget.isActive).toBe(false);
      budget.activate();
      expect(budget.isActive).toBe(true);
    });
  });

  describe('computeEndDate', () => {
    it('returns the explicit endDate when provided', () => {
      const end = new Date('2026-02-15T00:00:00Z');
      const b = new Budget({ ...validProps, endDate: end });
      expect(b.computeEndDate()).toEqual(end);
    });

    it('adds one month for monthly when endDate is null', () => {
      const b = new Budget({ ...validProps, period: 'monthly', endDate: null });
      const expected = new Date(validProps.startDate);
      expected.setMonth(expected.getMonth() + 1);
      expect(b.computeEndDate().getTime()).toBe(expected.getTime());
    });

    it('adds one year for yearly when endDate is null', () => {
      const b = new Budget({ ...validProps, period: 'yearly', endDate: null });
      const expected = new Date(validProps.startDate);
      expected.setFullYear(expected.getFullYear() + 1);
      expect(b.computeEndDate().getTime()).toBe(expected.getTime());
    });
  });

  describe('belongsToUser & toJSON', () => {
    it('belongsToUser returns true only for the owner', () => {
      const b = new Budget({ ...validProps, userId: 'owner' });
      expect(b.belongsToUser('owner')).toBe(true);
      expect(b.belongsToUser('someone-else')).toBe(false);
    });

    it('toJSON returns a serializable snapshot', () => {
      const b = new Budget(validProps);
      const json = b.toJSON();
      expect(json.userId).toBe('user-1');
      expect(json.name).toBe('Streaming');
      expect(json.period).toBe('monthly');
    });
  });
});
