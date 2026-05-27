import { useState, useCallback, useRef } from 'react';
import { eventService, categoryService, type Event, type Category } from '@/services/api';
import { PERIOD_LABELS, type Period } from '@/types/statistics';
import i18n from '@/i18n';

export type TimePeriod = Period;

export interface CategoryBreakdown {
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export interface PeriodStats {
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  categoryBreakdown: CategoryBreakdown[];
}

export function useStatistics() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  const timePeriods: { key: TimePeriod; label: string }[] = (
    ['day', 'week', 'month', 'year'] as const
  ).map((key) => ({ key, label: PERIOD_LABELS[key] }));

  const fetchData = useCallback(async () => {
    try {
      if (initialLoad.current) setLoading(true);
      setError(null);
      const [eventsData, categoriesData] = await Promise.all([
        eventService.getAll(),
        categoryService.getAll(),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.statisticsLoadFailed'));
    } finally {
      setLoading(false);
      initialLoad.current = false;
    }
  }, []);

  const getEventsForPeriod = useCallback((period: TimePeriod): Event[] => {
    const now = new Date();

    return events.filter((event) => {
      if (!event.dueDate) return false;
      const eventDate = new Date(event.dueDate);
      if (isNaN(eventDate.getTime())) return false;

      switch (period) {
        case 'day':
          return eventDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];

        case 'week': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return eventDate >= startOfWeek && eventDate <= endOfWeek;
        }

        case 'month':
          return (
            eventDate.getMonth() === now.getMonth() &&
            eventDate.getFullYear() === now.getFullYear()
          );

        case 'year':
          return eventDate.getFullYear() === now.getFullYear();

        default:
          return false;
      }
    });
  }, [events]);

  const safeAmount = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const getStatsForPeriod = useCallback((period: TimePeriod): PeriodStats => {
    const periodEvents = getEventsForPeriod(period);

    let totalExpenses = 0;
    const categoryMap = new Map<string, { total: number; count: number }>();

    periodEvents.forEach((event) => {
      const amount = safeAmount(event.subscription?.amount);
      totalExpenses += amount;

      const catName = event.subscription?.category?.name || 'Autre';
      const existing = categoryMap.get(catName) || { total: 0, count: 0 };
      categoryMap.set(catName, {
        total: existing.total + amount,
        count: existing.count + 1,
      });
    });

    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([name, data]) => {
        const cat = categories.find((c) => c.name === name);
        return {
          name,
          icon: cat?.icon || '📁',
          color: cat?.color || '#6366f1',
          total: data.total,
          count: data.count,
        };
      })
      .sort((a, b) => b.total - a.total);

    const safeTotal = Number.isFinite(totalExpenses) ? totalExpenses : 0;
    return {
      totalExpenses: safeTotal,
      transactionCount: periodEvents.length,
      averageTransaction: periodEvents.length > 0 ? safeTotal / periodEvents.length : 0,
      categoryBreakdown,
    };
  }, [getEventsForPeriod, categories]);

  return {
    activePeriod,
    setActivePeriod,
    timePeriods,
    loading,
    error,
    fetchData,
    getStatsForPeriod,
  };
}
