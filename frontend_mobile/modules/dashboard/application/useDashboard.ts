import { useState, useEffect } from 'react';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';
import { eventService } from '@/modules/dashboard/infrastructure/eventApi';
import type { Category, Event } from '@/services/api/types';
import { useTranslation } from '@/shared/application/I18nContext';
import { isDateInPeriod } from '@/utils/eventFilter';
import i18n from '@/i18n';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export interface AggregatedEvent extends Event {
  totalAmount: number;
  occurrences: number;
}

export function useDashboard() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addOperationModalOpen, setAddOperationModalOpen] = useState(false);

  // API data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timePeriods: { key: TimePeriod; label: string; value: string }[] = [
    { key: 'day', label: t('dashboard.periods.day'), value: '1' },
    { key: 'week', label: t('dashboard.periods.week'), value: '2' },
    { key: 'month', label: t('dashboard.periods.month'), value: '3' },
    { key: 'year', label: t('dashboard.periods.year'), value: '4' },
  ];

  // Fetch categories and events from API
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and events in parallel
      const [categoriesData, eventsData] = await Promise.all([
        categoryService.getAll(),
        eventService.getAll(),
      ]);

      setCategories(categoriesData);
      // Exclure les événements annulés — ils ne doivent pas apparaître sur le calendrier
      setEvents(eventsData.filter(e => e.status !== 'canceled'));
      console.log("eventsData", JSON.stringify(eventsData));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.dashboardLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Filter events by period
  const getEventsForPeriod = (period: TimePeriod, dateString?: string, categoryName?: string | null): AggregatedEvent[] => {
    const referenceDate = dateString ? new Date(dateString) : new Date();
    if (isNaN(referenceDate.getTime())) return [];

    let filteredEvents = events.filter((event) => {
      if (!event.dueDate) return false;
      const eventDate = new Date(event.dueDate);
      if (isNaN(eventDate.getTime())) return false;
      if (categoryName && event.subscription?.category?.name !== categoryName) return false;
      return isDateInPeriod(eventDate, period, referenceDate);
    });

    // For 'year': aggregate by subscription ID, sum all occurrence amounts
    if (period === 'year') {
      const aggregationMap = new Map<string, AggregatedEvent>();

      filteredEvents.forEach((event) => {
        const subId = event.subscription?.id ?? event.id;
        const amount = event.subscription?.amount ?? 0;

        if (aggregationMap.has(subId)) {
          const existing = aggregationMap.get(subId)!;
          existing.totalAmount = parseFloat((existing.totalAmount + amount).toFixed(2));
          existing.occurrences += 1;
        } else {
          aggregationMap.set(subId, {
            ...event,
            totalAmount: amount,
            occurrences: 1,
          });
        }
      });

      return Array.from(aggregationMap.values());
    }

    return filteredEvents.map((event) => ({
      ...event,
      totalAmount: event.subscription?.amount ?? 0,
      occurrences: 1,
    }));
  };

  // Filter events by selected date
  const getEventsForDate = (date: string): Event[] => {
    return events.filter((event) => {
      if (!event.dueDate) return false;
      try {
        const eventDateObj = new Date(event.dueDate);
        if (isNaN(eventDateObj.getTime())) return false;
        const eventDate = eventDateObj.toISOString().split('T')[0];
        return eventDate === date;
      } catch {
        return false;
      }
    });
  };

  // Filter events by category
  const getEventsByCategory = (categoryName: string | null): Event[] => {
    if (!categoryName) return events;
    return events.filter((event) =>
      event.subscription?.category?.name === categoryName
    );
  };

  return {
    selected,
    setSelected,
    activePeriod,
    setActivePeriod,
    categoriesOpen,
    setCategoriesOpen,
    selectedCategory,
    setSelectedCategory,
    addOperationModalOpen,
    setAddOperationModalOpen,
    timePeriods,
    getEventsForPeriod,
    // API data
    categories,
    events,
    loading,
    error,
    // Helper functions
    fetchDashboardData,
    getEventsForDate,
    getEventsByCategory,
  };
}
