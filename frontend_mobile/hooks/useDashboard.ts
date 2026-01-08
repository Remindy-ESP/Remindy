import { useState, useEffect } from 'react';
import { categoryService, eventService, type Category, type Event } from '@/services/api';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

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
      setEvents(eventsData);
      console.log("eventsData", JSON.stringify(eventsData));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Filter events by period
  const getEventsForPeriod = (period: TimePeriod, dateString?: string): Event[] => {
    const referenceDate = dateString ? new Date(dateString) : new Date();
    if (isNaN(referenceDate.getTime())) return [];

    let filteredEvents = events.filter((event) => {
      if (!event.dueDate) return false;
      const eventDate = new Date(event.dueDate);
      if (isNaN(eventDate.getTime())) return false;

      switch (period) {
        case 'day':
          return eventDate.toISOString().split('T')[0] === referenceDate.toISOString().split('T')[0];

        case 'week': {
          const startOfWeek = new Date(referenceDate);
          startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay()); // Sunday
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

    // Post-processing for 'year' to deduplicate ONLY 'one-time' subscriptions
    if (period === 'year') {
      const seenOneTimeSubscriptions = new Set<string>();
      return filteredEvents.filter((event) => {
        // If it's a one-time subscription, we only want to show it once per year
        if (event.subscription?.frequency === 'one-time' && event.subscription.id) {
          if (seenOneTimeSubscriptions.has(event.subscription.id)) {
            return false;
          }
          seenOneTimeSubscriptions.add(event.subscription.id);
          return true;
        }
        // For all other frequencies (monthly, weekly, etc.), show all occurrences
        return true;
      });
    }

    return filteredEvents;
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
