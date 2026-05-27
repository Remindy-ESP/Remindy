import { useCallback, useMemo, useState } from 'react';
import { PeriodOption } from './PeriodFilter';
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '@/utils/dateBoundaries';

export interface PeriodDateRange {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface UsePeriodFilterOptions {
  initialPeriod?: PeriodOption;
  referenceDate?: Date;
}

export interface UsePeriodFilterResult {
  period: PeriodOption;
  setPeriod: (next: PeriodOption) => void;
  range: PeriodDateRange;
}

export function rangeForPeriod(period: PeriodOption, reference: Date): PeriodDateRange {
  switch (period) {
    case 'day': {
      const start = startOfDay(reference);
      const end = endOfDay(reference);
      const prev = new Date(reference);
      prev.setDate(prev.getDate() - 1);
      return { start, end, previousStart: startOfDay(prev), previousEnd: endOfDay(prev) };
    }
    case 'week': {
      const start = startOfWeek(reference);
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      const prevEnd = endOfDay(new Date(start.getTime() - 1));
      const prevStart = startOfWeek(prevEnd);
      return { start, end, previousStart: prevStart, previousEnd: prevEnd };
    }
    case 'month': {
      const start = startOfMonth(reference);
      const end = endOfMonth(reference);
      const prev = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
      return {
        start,
        end,
        previousStart: startOfMonth(prev),
        previousEnd: endOfMonth(prev),
      };
    }
    case 'year': {
      const start = startOfYear(reference);
      const end = endOfYear(reference);
      const prev = new Date(reference.getFullYear() - 1, 0, 1);
      return {
        start,
        end,
        previousStart: startOfYear(prev),
        previousEnd: endOfYear(prev),
      };
    }
  }
}

export function usePeriodFilter(options: UsePeriodFilterOptions = {}): UsePeriodFilterResult {
  const { initialPeriod = 'month', referenceDate } = options;
  const [period, setPeriod] = useState<PeriodOption>(initialPeriod);

  const range = useMemo(
    () => rangeForPeriod(period, referenceDate ?? new Date()),
    [period, referenceDate],
  );

  const setPeriodSafe = useCallback((next: PeriodOption) => setPeriod(next), []);

  return { period, setPeriod: setPeriodSafe, range };
}
