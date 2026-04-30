export type Period = 'day' | 'week' | 'month' | 'year';

export const PERIODS: readonly Period[] = ['day', 'week', 'month', 'year'] as const;

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

export const COMPARISON_LABELS: Record<Period, string> = {
  day: 'Comparo M-1',
  week: 'Comparo S-1',
  month: 'Comparo M-1',
  year: 'Comparo A-1',
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

// Monday-first week (FR convention).
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class DateRangeVO {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly previousStartDate: Date,
    public readonly previousEndDate: Date,
  ) {}

  static forPeriod(period: Period, referenceDate: Date = new Date()): DateRangeVO {
    const ref = new Date(referenceDate);

    switch (period) {
      case 'day': {
        // Comparison spec: cumulative MTD vs same day-range last month.
        const start = startOfMonth(ref);
        const end = endOfDay(ref);
        const prevStart = startOfMonth(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
        const prevEnd = endOfDay(new Date(ref.getFullYear(), ref.getMonth() - 1, ref.getDate()));
        return new DateRangeVO(start, end, prevStart, prevEnd);
      }

      case 'week': {
        // Comparison spec: last full week vs the week before.
        const currentWeekStart = startOfWeek(ref);
        const lastWeekEnd = endOfDay(new Date(currentWeekStart.getTime() - 1));
        const lastWeekStart = startOfWeek(lastWeekEnd);
        const previousWeekEnd = endOfDay(new Date(lastWeekStart.getTime() - 1));
        const previousWeekStart = startOfWeek(previousWeekEnd);
        return new DateRangeVO(lastWeekStart, lastWeekEnd, previousWeekStart, previousWeekEnd);
      }

      case 'month': {
        const start = startOfMonth(ref);
        const end = endOfMonth(ref);
        const prev = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
        return new DateRangeVO(start, end, startOfMonth(prev), endOfMonth(prev));
      }

      case 'year': {
        const start = startOfYear(ref);
        const end = endOfYear(ref);
        const prev = new Date(ref.getFullYear() - 1, 0, 1);
        return new DateRangeVO(start, end, startOfYear(prev), endOfYear(prev));
      }
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
