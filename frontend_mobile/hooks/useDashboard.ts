import { useState, useEffect } from 'react';
import { categoryService, eventService, type Category, type Event } from '@/services/api';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export function useDashboard() {
  const [selected, setSelected] = useState('');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getContentForPeriod = (period: TimePeriod): string => {
    const periodData = timePeriods.find((p) => p.key === period);
    return periodData?.value || '1';
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
    timePeriods,
    getContentForPeriod,
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
