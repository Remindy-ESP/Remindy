import {
  isTrialActive,
  addDaysUTC,
  addMonthsUTC,
  addYearsUTC,
  toUTCMidnight,
  isSameUTCDay,
  toUTCDateString,
} from './date.utils';

describe('Date Utils', () => {
  describe('isTrialActive', () => {
    it('should return false when trialEndDate is null', () => {
      expect(isTrialActive(null)).toBe(false);
    });

    it('should return false when trialEndDate is undefined', () => {
      expect(isTrialActive(undefined)).toBe(false);
    });

    it('should return true when trial end date is today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(isTrialActive(today)).toBe(true);
    });

    it('should return true when trial end date is in the future', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);

      expect(isTrialActive(future)).toBe(true);
    });

    it('should return false when trial end date is in the past', () => {
      const past = new Date();
      past.setDate(past.getDate() - 7);

      expect(isTrialActive(past)).toBe(false);
    });

    it('should return false when trial ended yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isTrialActive(yesterday)).toBe(false);
    });

    it('should return true when trial ends tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isTrialActive(tomorrow)).toBe(true);
    });

    it('should ignore time component when comparing dates', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      expect(isTrialActive(today)).toBe(true);
    });
  });

  describe('addDaysUTC', () => {
    it('should add positive days to a date', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = addDaysUTC(date, 7);

      expect(result.toISOString()).toBe('2024-01-22T12:00:00.000Z');
    });

    it('should add negative days to a date', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = addDaysUTC(date, -5);

      expect(result.toISOString()).toBe('2024-01-10T12:00:00.000Z');
    });

    it('should handle adding zero days', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = addDaysUTC(date, 0);

      expect(result.toISOString()).toBe(date.toISOString());
    });

    it('should handle month boundary correctly', () => {
      const date = new Date('2024-01-28T12:00:00Z');
      const result = addDaysUTC(date, 5);

      expect(result.toISOString()).toBe('2024-02-02T12:00:00.000Z');
    });

    it('should handle year boundary correctly', () => {
      const date = new Date('2024-12-28T12:00:00Z');
      const result = addDaysUTC(date, 5);

      expect(result.toISOString()).toBe('2025-01-02T12:00:00.000Z');
    });

    it('should preserve time when adding days', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = addDaysUTC(date, 3);

      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(45);
    });

    it('should not mutate the original date', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const original = date.toISOString();
      addDaysUTC(date, 7);

      expect(date.toISOString()).toBe(original);
    });
  });

  describe('addMonthsUTC', () => {
    it('should add positive months to a date', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = addMonthsUTC(date, 3);

      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(3);
      expect(result.getUTCDate()).toBe(15);
    });

    it('should add negative months to a date', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = addMonthsUTC(date, -3);

      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(2);
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle year boundary when adding months', () => {
      const date = new Date('2024-11-15T12:00:00Z');
      const result = addMonthsUTC(date, 3);

      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle year boundary when subtracting months', () => {
      const date = new Date('2024-02-15T12:00:00Z');
      const result = addMonthsUTC(date, -3);

      expect(result.getUTCFullYear()).toBe(2023);
      expect(result.getUTCMonth()).toBe(10);
    });

    it('should handle day overflow when target month has fewer days', () => {
      const date = new Date('2024-01-31T12:00:00Z');
      const result = addMonthsUTC(date, 1);

      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(29);
    });

    it('should handle March 31 to April (30 days)', () => {
      const date = new Date('2024-03-31T12:00:00Z');
      const result = addMonthsUTC(date, 1);

      expect(result.getUTCMonth()).toBe(3);
      expect(result.getUTCDate()).toBe(30);
    });

    it('should handle adding zero months', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = addMonthsUTC(date, 0);

      expect(result.toISOString()).toBe(date.toISOString());
    });

    it('should not mutate the original date', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const original = date.toISOString();
      addMonthsUTC(date, 3);

      expect(date.toISOString()).toBe(original);
    });
  });

  describe('addYearsUTC', () => {
    it('should add positive years to a date', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = addYearsUTC(date, 2);

      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(5);
      expect(result.getUTCDate()).toBe(15);
    });

    it('should add negative years to a date', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = addYearsUTC(date, -5);

      expect(result.getUTCFullYear()).toBe(2019);
      expect(result.getUTCMonth()).toBe(5);
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle leap year to non-leap year (Feb 29 to Feb 28)', () => {
      const date = new Date('2024-02-29T12:00:00Z');
      const result = addYearsUTC(date, 1);

      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(28);
    });

    it('should handle non-leap year to leap year correctly', () => {
      const date = new Date('2023-02-28T12:00:00Z');
      const result = addYearsUTC(date, 1);

      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(28);
    });

    it('should handle adding zero years', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = addYearsUTC(date, 0);

      expect(result.toISOString()).toBe(date.toISOString());
    });

    it('should not mutate the original date', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const original = date.toISOString();
      addYearsUTC(date, 2);

      expect(date.toISOString()).toBe(original);
    });
  });

  describe('toUTCMidnight', () => {
    it('should convert date to midnight UTC', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const result = toUTCMidnight(date);

      expect(result.toISOString()).toBe('2024-06-15T00:00:00.000Z');
    });

    it('should handle date already at midnight', () => {
      const date = new Date('2024-06-15T00:00:00.000Z');
      const result = toUTCMidnight(date);

      expect(result.toISOString()).toBe('2024-06-15T00:00:00.000Z');
    });

    it('should handle end of day time', () => {
      const date = new Date('2024-06-15T23:59:59.999Z');
      const result = toUTCMidnight(date);

      expect(result.toISOString()).toBe('2024-06-15T00:00:00.000Z');
    });

    it('should not mutate the original date', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const original = date.toISOString();
      toUTCMidnight(date);

      expect(date.toISOString()).toBe(original);
    });
  });

  describe('isSameUTCDay', () => {
    it('should return true for same day with same time', () => {
      const date1 = new Date('2024-06-15T12:00:00Z');
      const date2 = new Date('2024-06-15T12:00:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(true);
    });

    it('should return true for same day with different times', () => {
      const date1 = new Date('2024-06-15T08:30:00Z');
      const date2 = new Date('2024-06-15T20:45:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-06-15T23:59:59Z');
      const date2 = new Date('2024-06-16T00:00:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2024-06-30T12:00:00Z');
      const date2 = new Date('2024-07-30T12:00:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should return false for different years', () => {
      const date1 = new Date('2024-06-15T12:00:00Z');
      const date2 = new Date('2025-06-15T12:00:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(false);
    });

    it('should handle dates at midnight', () => {
      const date1 = new Date('2024-06-15T00:00:00Z');
      const date2 = new Date('2024-06-15T00:00:00Z');

      expect(isSameUTCDay(date1, date2)).toBe(true);
    });
  });

  describe('toUTCDateString', () => {
    it('should format date to YYYY-MM-DD string', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-06-15');
    });

    it('should format date with single digit month correctly', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-01-05');
    });

    it('should format date with single digit day correctly', () => {
      const date = new Date('2024-12-03T12:00:00Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-12-03');
    });

    it('should format date at midnight', () => {
      const date = new Date('2024-06-15T00:00:00Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-06-15');
    });

    it('should format date at end of day', () => {
      const date = new Date('2024-06-15T23:59:59.999Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-06-15');
    });

    it('should format leap year date', () => {
      const date = new Date('2024-02-29T12:00:00Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-02-29');
    });

    it('should format year boundary date', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      const result = toUTCDateString(date);

      expect(result).toBe('2024-12-31');
    });
  });
});
