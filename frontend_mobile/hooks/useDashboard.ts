import { useState, useEffect } from 'react';
import { categoryService, eventService, type Category, type Event } from '@/services/api';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export interface AggregatedEvent extends Event {
  totalAmount: number;
  occurrences: number;
}

export function useDashboard() {
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
    { key: 'day', label: 'Ce jour', value: '1' },
    { key: 'week', label: 'Semaine', value: '2' },
    { key: 'month', label: 'Mensuel', value: '3' },
    { key: 'year', label: 'Année', value: '4' },
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
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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

      // Apply category filter
      if (categoryName && event.subscription?.category?.name !== categoryName) return false;

      switch (period) {
        case 'day':
          return eventDate.toISOString().split('T')[0] === referenceDate.toISOString().split('T')[0];

        case 'week': {
          const startOfWeek = new Date(referenceDate);
          startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          return eventDate >= startOfWeek && eventDate <= endOfWeek;
        }

        case 'month':
          return (
            eventDate.getMonth() === referenceDate.getMonth() &&
            eventDate.getFullYear() === referenceDate.getFullYear()
          );

        case 'year':
          return eventDate.getFullYear() === referenceDate.getFullYear();

        default:
          return false;
      }
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
