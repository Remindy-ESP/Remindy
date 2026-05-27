export type FilterPeriod = 'day' | 'week' | 'month' | 'year';

export function isDateInPeriod(eventDate: Date, period: FilterPeriod, referenceDate: Date = new Date()): boolean {
  switch (period) {
    case 'day':
      return eventDate.toISOString().split('T')[0] === referenceDate.toISOString().split('T')[0];

    case 'week': {
      const weekStart = new Date(referenceDate);
      weekStart.setDate(referenceDate.getDate() - referenceDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }

    case 'month':
      return (
        eventDate.getMonth() === referenceDate.getMonth() &&
        eventDate.getFullYear() === referenceDate.getFullYear()
      );

    case 'year':
      return eventDate.getFullYear() === referenceDate.getFullYear();
  }
}
