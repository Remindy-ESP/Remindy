import { calculateDateRange, formatPeriodLabel } from '../periodCalculator';

describe('calculateDateRange', () => {
  describe("'day'", () => {
    it('uses month-to-date for the current window', () => {
      const range = calculateDateRange('day', new Date(2025, 9, 5, 14, 30));
      expect(range.startDate).toEqual(new Date(2025, 9, 1, 0, 0, 0, 0));
      expect(range.endDate.getDate()).toBe(5);
      expect(range.endDate.getHours()).toBe(23);
    });

    it('uses the same day-range last month for the previous window', () => {
      const range = calculateDateRange('day', new Date(2025, 9, 5));
      expect(range.previousStartDate).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
      expect(range.previousEndDate.getDate()).toBe(5);
      expect(range.previousEndDate.getMonth()).toBe(8);
    });
  });

  describe("'week'", () => {
    it('uses last full week (Monday-first) for the current window', () => {
      // Wed 15 oct 2025 — current week starts Mon 13, last full week is Mon 6 → Sun 12.
      const range = calculateDateRange('week', new Date(2025, 9, 15));
      expect(range.startDate).toEqual(new Date(2025, 9, 6, 0, 0, 0, 0));
      expect(range.endDate.getDate()).toBe(12);
    });

    it('uses the week before that for the previous window', () => {
      const range = calculateDateRange('week', new Date(2025, 9, 15));
      // Week before: Mon 29 sept → Sun 5 oct
      expect(range.previousStartDate).toEqual(new Date(2025, 8, 29, 0, 0, 0, 0));
      expect(range.previousEndDate.getMonth()).toBe(9);
      expect(range.previousEndDate.getDate()).toBe(5);
    });
  });

  describe("'month'", () => {
    it('uses the current month for the current window', () => {
      const range = calculateDateRange('month', new Date(2025, 9, 5));
      expect(range.startDate).toEqual(new Date(2025, 9, 1, 0, 0, 0, 0));
      expect(range.endDate.getDate()).toBe(31);
    });

    it('uses the previous month for the previous window', () => {
      const range = calculateDateRange('month', new Date(2025, 9, 5));
      expect(range.previousStartDate).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
      expect(range.previousEndDate.getDate()).toBe(30);
    });

    it('handles January (rolls to previous December)', () => {
      const range = calculateDateRange('month', new Date(2025, 0, 15));
      expect(range.previousStartDate.getFullYear()).toBe(2024);
      expect(range.previousStartDate.getMonth()).toBe(11);
    });
  });

  describe("'year'", () => {
    it('uses the current year for the current window', () => {
      const range = calculateDateRange('year', new Date(2025, 5, 15));
      expect(range.startDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
      expect(range.endDate.getMonth()).toBe(11);
      expect(range.endDate.getDate()).toBe(31);
    });

    it('uses the previous year for the previous window', () => {
      const range = calculateDateRange('year', new Date(2025, 5, 15));
      expect(range.previousStartDate).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0));
      expect(range.previousEndDate.getFullYear()).toBe(2024);
    });
  });

  it('defaults to now() when no reference date is provided', () => {
    const range = calculateDateRange('year');
    expect(range.startDate.getFullYear()).toBe(new Date().getFullYear());
  });
});

describe('formatPeriodLabel', () => {
  it("formats 'day' as '<d> <month> <year>' in French", () => {
    expect(formatPeriodLabel(new Date(2025, 9, 5), 'day')).toBe('5 octobre 2025');
  });

  it("formats 'week' as 'Semaine du <d> <month> <year>' (Monday start)", () => {
    // Wed 15 oct 2025 → Mon 13 oct 2025
    expect(formatPeriodLabel(new Date(2025, 9, 15), 'week')).toBe('Semaine du 13 octobre 2025');
  });

  it("formats 'month' as '<Capitalised month> <year>'", () => {
    expect(formatPeriodLabel(new Date(2025, 9, 5), 'month')).toBe('Octobre 2025');
  });

  it("formats 'year' as '<year>'", () => {
    expect(formatPeriodLabel(new Date(2025, 5, 15), 'year')).toBe('2025');
  });
});
