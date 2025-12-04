import { useState } from 'react';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export function useDashboard() {
  const [selected, setSelected] = useState('');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const timePeriods: { key: TimePeriod; label: string; value: string }[] = [
    { key: 'day', label: 'Ce jour', value: '1' },
    { key: 'week', label: 'Semaine', value: '2' },
    { key: 'month', label: 'Mensuel', value: '3' },
    { key: 'year', label: 'Année', value: '4' },
  ];

  // Catégories hardcodées pour l'instant
  const categories = ['Streaming', 'Sport', 'Banque'];

  const getContentForPeriod = (period: TimePeriod): string => {
    const periodData = timePeriods.find((p) => p.key === period);
    return periodData?.value || '1';
  };

  return {
    selected,
    setSelected,
    activePeriod,
    setActivePeriod,
    filtersOpen,
    setFiltersOpen,
    categoriesOpen,
    setCategoriesOpen,
    selectedCategory,
    setSelectedCategory,
    categories,
    timePeriods,
    getContentForPeriod,
  };
}
