import type { DateRange, Period } from '@/types/statistics';
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '@/utils/dateBoundaries';

const MONTH_NAMES_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function calculateDateRange(period: Period, referenceDate: Date = new Date()): DateRange {
  const ref = new Date(referenceDate);

  switch (period) {
    case 'day': {
      // Cumulative MTD: 1st of current month → today, vs 1st of previous month → same day-of-month last month.
      const startDate = startOfMonth(ref);
      const endDate = endOfDay(ref);
      const previousStartDate = startOfMonth(
        new Date(ref.getFullYear(), ref.getMonth() - 1, 1),
      );
      const previousEndDate = endOfDay(
        new Date(ref.getFullYear(), ref.getMonth() - 1, ref.getDate()),
      );
      return { startDate, endDate, previousStartDate, previousEndDate };
    }

    case 'week': {
      // Last full week vs the week before.
      const currentWeekStart = startOfWeek(ref);
      const lastWeekEnd = endOfDay(new Date(currentWeekStart.getTime() - 1));
      const lastWeekStart = startOfWeek(lastWeekEnd);
      const previousWeekEnd = endOfDay(new Date(lastWeekStart.getTime() - 1));
      const previousWeekStart = startOfWeek(previousWeekEnd);
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        previousStartDate: previousWeekStart,
        previousEndDate: previousWeekEnd,
      };
    }

    case 'month': {
      const startDate = startOfMonth(ref);
      const endDate = endOfMonth(ref);
      const prev = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      return {
        startDate,
        endDate,
        previousStartDate: startOfMonth(prev),
        previousEndDate: endOfMonth(prev),
      };
    }

    case 'year': {
      const startDate = startOfYear(ref);
      const endDate = endOfYear(ref);
      const prev = new Date(ref.getFullYear() - 1, 0, 1);
      return {
        startDate,
        endDate,
        previousStartDate: startOfYear(prev),
        previousEndDate: endOfYear(prev),
      };
    }
  }
}

export function formatPeriodLabel(date: Date, period: Period): string {
  const day = date.getDate();
  const month = MONTH_NAMES_FR[date.getMonth()];
  const year = date.getFullYear();

  switch (period) {
    case 'day':
      return `${day} ${month} ${year}`;
    case 'week': {
      const weekStart = startOfWeek(date);
      return `Semaine du ${weekStart.getDate()} ${MONTH_NAMES_FR[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    case 'month':
      return `${capitalize(month)} ${year}`;
    case 'year':
      return `${year}`;
  }
}
