import { act, renderHook } from '@testing-library/react-native';
import { rangeForPeriod, usePeriodFilter } from '../usePeriodFilter';

describe('rangeForPeriod', () => {
  it('returns the day range and yesterday as the comparison', () => {
    const ref = new Date(2026, 2, 15, 12, 0, 0);
    const range = rangeForPeriod('day', ref);
    expect(range.start.getDate()).toBe(15);
    expect(range.start.getHours()).toBe(0);
    expect(range.end.getDate()).toBe(15);
    expect(range.end.getHours()).toBe(23);
    expect(range.previousStart.getDate()).toBe(14);
    expect(range.previousEnd.getDate()).toBe(14);
  });

  it('returns the calendar week starting Monday', () => {
    const ref = new Date('2026-05-13T10:00:00Z'); // Wednesday
    const range = rangeForPeriod('week', ref);
    expect(range.start.getDay()).toBe(1); // Monday
    expect(range.previousEnd.getTime() + 1).toBe(range.start.getTime());
  });

  it('returns the calendar month range', () => {
    const ref = new Date('2026-04-15T00:00:00Z');
    const range = rangeForPeriod('month', ref);
    expect(range.start.getMonth()).toBe(3);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(3);
    expect(range.previousStart.getMonth()).toBe(2);
    expect(range.previousEnd.getMonth()).toBe(2);
  });

  it('returns the calendar year range', () => {
    const ref = new Date('2026-07-15T00:00:00Z');
    const range = rangeForPeriod('year', ref);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(0);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(11);
    expect(range.previousStart.getFullYear()).toBe(2025);
    expect(range.previousEnd.getFullYear()).toBe(2025);
  });
});

describe('usePeriodFilter', () => {
  it('defaults to month period', () => {
    const { result } = renderHook(() => usePeriodFilter());
    expect(result.current.period).toBe('month');
  });

  it('respects initialPeriod', () => {
    const { result } = renderHook(() => usePeriodFilter({ initialPeriod: 'week' }));
    expect(result.current.period).toBe('week');
  });

  it('recomputes the range when the period changes', () => {
    const ref = new Date('2026-06-15T00:00:00Z');
    const { result } = renderHook(() => usePeriodFilter({ referenceDate: ref }));
    const monthRange = result.current.range;
    expect(monthRange.start.getMonth()).toBe(5);

    act(() => {
      result.current.setPeriod('year');
    });

    expect(result.current.period).toBe('year');
    expect(result.current.range.start.getMonth()).toBe(0);
  });

  it('uses the reference date when provided', () => {
    const ref = new Date('2026-12-25T00:00:00Z');
    const { result } = renderHook(() =>
      usePeriodFilter({ initialPeriod: 'month', referenceDate: ref }),
    );
    expect(result.current.range.start.getMonth()).toBe(11);
    expect(result.current.range.start.getFullYear()).toBe(2026);
  });
});
