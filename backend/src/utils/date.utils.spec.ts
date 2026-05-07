import {
  isTrialActive,
  addDaysUTC,
  addMonthsUTC,
  addYearsUTC,
  toUTCMidnight,
  isSameUTCDay,
  toUTCDateString,
} from './date.utils';

describe('date.utils', () => {
  describe('isTrialActive', () => {
    it('should return false when trialEndDate is undefined', () => {
      expect(isTrialActive(undefined)).toBe(false);
    });

    it('should return false when trialEndDate is null', () => {
      expect(isTrialActive(null)).toBe(false);
    });

    it('should return true when trialEndDate is today (same day)', () => {
      const today = new Date();
      expect(isTrialActive(today)).toBe(true);
    });

    it('should return true when trialEndDate is in the future', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(isTrialActive(future)).toBe(true);
    });

    it('should return false when trialEndDate was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isTrialActive(yesterday)).toBe(false);
    });

    it('should return false when trialEndDate was far in the past', () => {
      const past = new Date('2020-01-01');
      expect(isTrialActive(past)).toBe(false);
    });
  });

  describe('addDaysUTC', () => {
    it('should add days to a date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = addDaysUTC(date, 5);
      expect(result.toISOString()).toBe('2025-01-06T00:00:00.000Z');
    });

    it('should handle adding days across month boundaries', () => {
      const date = new Date('2025-01-30T00:00:00.000Z');
      const result = addDaysUTC(date, 3);
      expect(result.toISOString()).toBe('2025-02-02T00:00:00.000Z');
    });

    it('should handle adding 0 days (no change)', () => {
      const date = new Date('2025-06-15T00:00:00.000Z');
      const result = addDaysUTC(date, 0);
      expect(result.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    });

    it('should handle adding days across year boundaries', () => {
      const date = new Date('2024-12-30T00:00:00.000Z');
      const result = addDaysUTC(date, 5);
      expect(result.toISOString()).toBe('2025-01-04T00:00:00.000Z');
    });

    it('should not mutate the original date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      addDaysUTC(date, 10);
      expect(date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('addMonthsUTC', () => {
    it('should add months to a date', () => {
      const date = new Date('2025-01-15T00:00:00.000Z');
      const result = addMonthsUTC(date, 3);
      expect(result.getUTCMonth()).toBe(3); // April = month 3 (0-indexed)
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle end-of-month overflow (Jan 31 + 1 month -> Feb 28)', () => {
      const date = new Date('2025-01-31T00:00:00.000Z');
      const result = addMonthsUTC(date, 1);
      // Feb 31 doesn't exist -> should be last day of February (Feb 28 in 2025)
      expect(result.getUTCMonth()).toBe(1); // February
      expect(result.getUTCDate()).toBe(28);
    });

    it('should handle adding months across year boundaries', () => {
      const date = new Date('2025-11-15T00:00:00.000Z');
      const result = addMonthsUTC(date, 3);
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(1); // February
    });

    it('should handle adding 0 months', () => {
      const date = new Date('2025-06-15T00:00:00.000Z');
      const result = addMonthsUTC(date, 0);
      expect(result.getUTCMonth()).toBe(5); // June
      expect(result.getUTCDate()).toBe(15);
    });

    it('should not mutate the original date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const original = date.toISOString();
      addMonthsUTC(date, 3);
      expect(date.toISOString()).toBe(original);
    });
  });

  describe('addYearsUTC', () => {
    it('should add years to a date', () => {
      const date = new Date('2025-06-15T00:00:00.000Z');
      const result = addYearsUTC(date, 2);
      expect(result.getUTCFullYear()).toBe(2027);
      expect(result.getUTCMonth()).toBe(5); // June
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle Feb 29 on leap year adding 1 year (non-leap)', () => {
      // 2024 is a leap year, Feb 29 exists
      const date = new Date('2024-02-29T00:00:00.000Z');
      const result = addYearsUTC(date, 1);
      // 2025 is not a leap year, Feb 29 doesn't exist -> last day of February = Feb 28
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(1); // February
      expect(result.getUTCDate()).toBe(28);
    });

    it('should handle adding 0 years', () => {
      const date = new Date('2025-03-10T00:00:00.000Z');
      const result = addYearsUTC(date, 0);
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCDate()).toBe(10);
    });

    it('should not mutate the original date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const original = date.toISOString();
      addYearsUTC(date, 1);
      expect(date.toISOString()).toBe(original);
    });
  });

  describe('toUTCMidnight', () => {
    it('should normalize date to midnight UTC', () => {
      const date = new Date('2025-06-15T14:30:00.000Z');
      const result = toUTCMidnight(date);
      expect(result.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    });

    it('should preserve the date when already at midnight UTC', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = toUTCMidnight(date);
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should not mutate the original date', () => {
      const date = new Date('2025-06-15T14:30:00.000Z');
      toUTCMidnight(date);
      expect(date.toISOString()).toBe('2025-06-15T14:30:00.000Z');
    });
  });

  describe('isSameUTCDay', () => {
    it('should return true when both dates are on the same UTC day', () => {
      const date1 = new Date('2025-06-15T08:00:00.000Z');
      const date2 = new Date('2025-06-15T23:59:59.000Z');
      expect(isSameUTCDay(date1, date2)).toBe(true);
    });

    it('should return false when dates are on different UTC days', () => {
      const date1 = new Date('2025-06-15T00:00:00.000Z');
      const date2 = new Date('2025-06-16T00:00:00.000Z');
      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should return false when dates differ by month', () => {
      const date1 = new Date('2025-05-15T00:00:00.000Z');
      const date2 = new Date('2025-06-15T00:00:00.000Z');
      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should return false when dates differ by year', () => {
      const date1 = new Date('2024-06-15T00:00:00.000Z');
      const date2 = new Date('2025-06-15T00:00:00.000Z');
      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should return true for identical dates', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      expect(isSameUTCDay(date, date)).toBe(true);
    });
  });

  describe('toUTCDateString', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-06-15T14:30:00.000Z');
      expect(toUTCDateString(date)).toBe('2025-06-15');
    });

    it('should format date at midnight correctly', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      expect(toUTCDateString(date)).toBe('2025-01-01');
    });

    it('should pad single-digit month and day', () => {
      const date = new Date('2025-03-05T00:00:00.000Z');
      expect(toUTCDateString(date)).toBe('2025-03-05');
    });
  });
});
