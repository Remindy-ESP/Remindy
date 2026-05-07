import { renderHook, act } from '@testing-library/react-native';
import { useDashboard } from '../useDashboard';
import { categoryService, eventService } from '../../services/api';
import type { Category, Event } from '../../services/api/types';

jest.mock('../../services/api', () => ({
  categoryService: {
    getAll: jest.fn(),
  },
  eventService: {
    getAll: jest.fn(),
  },
}));

const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;

const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Streaming',
    icon: 'play',
    color: '#FF0000',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat2',
    name: 'Music',
    icon: 'music',
    color: '#00FF00',
    isSystem: false,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'evt1',
  title: 'Netflix - February',
  dueDate: '2024-02-01T00:00:00.000Z',
  status: 'scheduled',
  subscriptionId: 'sub1',
  userId: 'user1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockEvents: Event[] = [
  makeEvent({ id: 'evt1', dueDate: '2024-02-15T00:00:00.000Z' }),
  makeEvent({
    id: 'evt2',
    title: 'Canceled event',
    status: 'canceled',
    dueDate: '2024-02-15T00:00:00.000Z',
  }),
  makeEvent({ id: 'evt3', dueDate: '2024-02-10T00:00:00.000Z' }),
];

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryService.getAll.mockResolvedValue(mockCategories);
    mockEventService.getAll.mockResolvedValue(mockEvents);
  });

  describe('initial state', () => {
    it('starts with loading true before data is fetched', () => {
      // Keep the promises pending so we can observe initial state
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));
      mockEventService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboard());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.categories).toEqual([]);
      expect(result.current.events).toEqual([]);
    });

    it('initialises UI state correctly', () => {
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));
      mockEventService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboard());

      expect(result.current.selected).toBe('');
      expect(result.current.activePeriod).toBe('day');
      expect(result.current.categoriesOpen).toBe(false);
      expect(result.current.selectedCategory).toBeNull();
      expect(result.current.addOperationModalOpen).toBe(false);
    });

    it('exposes all four time periods', () => {
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));
      mockEventService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboard());

      expect(result.current.timePeriods).toHaveLength(4);
      const keys = result.current.timePeriods.map((p) => p.key);
      expect(keys).toEqual(['day', 'week', 'month', 'year']);
    });
  });

  describe('successful data fetch', () => {
    it('loads categories and filters out canceled events', async () => {
      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        // let the initial useEffect settle
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.categories).toEqual(mockCategories);
      // evt2 is 'canceled' and should be excluded
      expect(result.current.events).toHaveLength(2);
      expect(result.current.events.every((e) => e.status !== 'canceled')).toBe(true);
    });

    it('calls categoryService.getAll and eventService.getAll', async () => {
      renderHook(() => useDashboard());

      await act(async () => {});

      expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);
      expect(mockEventService.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('sets error message when category fetch fails', async () => {
      mockCategoryService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDashboard());

      await act(async () => {});

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.categories).toEqual([]);
    });

    it('sets error message when event fetch fails', async () => {
      mockEventService.getAll.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useDashboard());

      await act(async () => {});

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Server error');
    });

    it('uses generic message for non-Error rejections', async () => {
      mockCategoryService.getAll.mockRejectedValue('some string error');

      const { result } = renderHook(() => useDashboard());

      await act(async () => {});

      expect(result.current.error).toBe('Failed to load dashboard data');
    });
  });

  describe('refresh functionality', () => {
    it('re-fetches data when fetchDashboardData is called manually', async () => {
      const { result } = renderHook(() => useDashboard());

      await act(async () => {});

      expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.fetchDashboardData();
      });

      expect(mockCategoryService.getAll).toHaveBeenCalledTimes(2);
      expect(mockEventService.getAll).toHaveBeenCalledTimes(2);
    });

    it('resets error state before re-fetching', async () => {
      mockCategoryService.getAll.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useDashboard());

      await act(async () => {});
      expect(result.current.error).toBe('First error');

      // Second call succeeds
      await act(async () => {
        await result.current.fetchDashboardData();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('UI state setters', () => {
    it('updates selected value', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      act(() => {
        result.current.setSelected('2024-02-15');
      });

      expect(result.current.selected).toBe('2024-02-15');
    });

    it('updates active period', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      act(() => {
        result.current.setActivePeriod('month');
      });

      expect(result.current.activePeriod).toBe('month');
    });

    it('toggles categories open state', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      act(() => {
        result.current.setCategoriesOpen(true);
      });

      expect(result.current.categoriesOpen).toBe(true);
    });

    it('updates selected category', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      act(() => {
        result.current.setSelectedCategory('Streaming');
      });

      expect(result.current.selectedCategory).toBe('Streaming');
    });

    it('toggles add operation modal', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      act(() => {
        result.current.setAddOperationModalOpen(true);
      });

      expect(result.current.addOperationModalOpen).toBe(true);
    });
  });

  describe('getEventsForDate', () => {
    const eventsOnDate: Event[] = [
      makeEvent({ id: 'a', dueDate: '2024-02-15T10:00:00.000Z' }),
      makeEvent({ id: 'b', dueDate: '2024-02-15T22:00:00.000Z' }),
      makeEvent({ id: 'c', dueDate: '2024-02-16T00:00:00.000Z' }),
    ];

    it('returns only events matching the given date', async () => {
      mockEventService.getAll.mockResolvedValue(eventsOnDate);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForDate('2024-02-15');
      expect(found).toHaveLength(2);
      expect(found.map((e) => e.id)).toEqual(['a', 'b']);
    });

    it('returns empty array when no events match', async () => {
      mockEventService.getAll.mockResolvedValue(eventsOnDate);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForDate('2099-01-01');
      expect(found).toEqual([]);
    });
  });

  describe('getEventsByCategory', () => {
    const streamingCategory: Category = {
      id: 'cat1',
      name: 'Streaming',
      icon: 'play',
      color: '#f00',
      isSystem: true,
      createdAt: '',
      updatedAt: '',
    };

    const eventsWithCategories: Event[] = [
      makeEvent({
        id: 'x1',
        subscription: {
          id: 'sub1',
          name: 'Netflix',
          amount: 15,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2024-01-01T00:00:00.000Z',
          nextDueDate: '2024-02-01T00:00:00.000Z',
          status: 'active',
          userId: 'user1',
          createdAt: '',
          updatedAt: '',
          category: streamingCategory,
        },
      }),
      makeEvent({
        id: 'x2',
        subscription: {
          id: 'sub2',
          name: 'Spotify',
          amount: 10,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2024-01-01T00:00:00.000Z',
          nextDueDate: '2024-02-01T00:00:00.000Z',
          status: 'active',
          userId: 'user1',
          createdAt: '',
          updatedAt: '',
          category: {
            id: 'cat2',
            name: 'Music',
            icon: 'music',
            color: '#0f0',
            isSystem: false,
            createdAt: '',
            updatedAt: '',
          },
        },
      }),
    ];

    it('filters events by category name', async () => {
      mockEventService.getAll.mockResolvedValue(eventsWithCategories);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsByCategory('Streaming');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('x1');
    });

    it('returns all events when categoryName is null', async () => {
      mockEventService.getAll.mockResolvedValue(eventsWithCategories);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsByCategory(null);
      expect(found).toHaveLength(2);
    });
  });

  describe('getEventsForPeriod', () => {
    it('returns events matching the day period', async () => {
      const targetDate = '2024-03-10T12:00:00.000Z';
      const dayEvents: Event[] = [
        makeEvent({ id: 'd1', dueDate: '2024-03-10T08:00:00.000Z' }),
        makeEvent({ id: 'd2', dueDate: '2024-03-11T08:00:00.000Z' }),
      ];
      mockEventService.getAll.mockResolvedValue(dayEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('day', targetDate);
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('d1');
    });

    it('aggregates events by subscription for year period', async () => {
      const yearEvents: Event[] = [
        makeEvent({
          id: 'y1',
          dueDate: '2024-01-01T00:00:00.000Z',
          subscriptionId: 'sub1',
          subscription: {
            id: 'sub1',
            name: 'Netflix',
            amount: 15,
            currency: 'EUR',
            frequency: 'monthly',
            startDate: '2024-01-01T00:00:00.000Z',
            nextDueDate: '2024-02-01T00:00:00.000Z',
            status: 'active',
            userId: 'user1',
            createdAt: '',
            updatedAt: '',
          },
        }),
        makeEvent({
          id: 'y2',
          dueDate: '2024-06-01T00:00:00.000Z',
          subscriptionId: 'sub1',
          subscription: {
            id: 'sub1',
            name: 'Netflix',
            amount: 15,
            currency: 'EUR',
            frequency: 'monthly',
            startDate: '2024-01-01T00:00:00.000Z',
            nextDueDate: '2024-02-01T00:00:00.000Z',
            status: 'active',
            userId: 'user1',
            createdAt: '',
            updatedAt: '',
          },
        }),
      ];
      mockEventService.getAll.mockResolvedValue(yearEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('year', '2024-07-01');
      // Both belong to same subscription — should be aggregated into one entry
      expect(found).toHaveLength(1);
      expect(found[0].totalAmount).toBe(30);
      expect(found[0].occurrences).toBe(2);
    });

    it('returns empty array for invalid date string', async () => {
      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('day', 'not-a-date');
      expect(found).toEqual([]);
    });

    // ── Week period ─────────────────────────────────────────────────────────

    it('returns events matching the week period', async () => {
      // 2024-03-10 is a Sunday. The week (Sun-Sat) is 2024-03-10 → 2024-03-16.
      const weekEvents: Event[] = [
        makeEvent({ id: 'w1', dueDate: '2024-03-10T00:00:00.000Z' }), // same Sunday
        makeEvent({ id: 'w2', dueDate: '2024-03-14T12:00:00.000Z' }), // mid-week
        makeEvent({ id: 'w3', dueDate: '2024-03-17T00:00:00.000Z' }), // next week
      ];
      mockEventService.getAll.mockResolvedValue(weekEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('week', '2024-03-12T00:00:00.000Z');
      expect(found.map((e) => e.id).sort()).toEqual(['w1', 'w2']);
    });

    // ── Month period ────────────────────────────────────────────────────────

    it('returns events matching the month period', async () => {
      const monthEvents: Event[] = [
        makeEvent({ id: 'm1', dueDate: '2024-03-01T12:00:00.000Z' }),
        makeEvent({ id: 'm2', dueDate: '2024-03-20T12:00:00.000Z' }),
        makeEvent({ id: 'm3', dueDate: '2024-04-01T12:00:00.000Z' }), // next month
      ];
      mockEventService.getAll.mockResolvedValue(monthEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('month', '2024-03-15T12:00:00.000Z');
      expect(found.map((e) => e.id).sort()).toEqual(['m1', 'm2']);
    });

    // ── Year period excludes other years ────────────────────────────────────

    it('excludes events from other years for year period', async () => {
      const yearEvents: Event[] = [
        makeEvent({
          id: 'y_in',
          dueDate: '2024-06-15T00:00:00.000Z',
          subscription: { id: 's1', name: 'X', amount: 10, currency: 'EUR', frequency: 'monthly', startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '' },
        }),
        makeEvent({
          id: 'y_out',
          dueDate: '2023-12-01T00:00:00.000Z',
          subscription: { id: 's2', name: 'Y', amount: 5, currency: 'EUR', frequency: 'monthly', startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '' },
        }),
      ];
      mockEventService.getAll.mockResolvedValue(yearEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('year', '2024-01-01T00:00:00.000Z');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('y_in');
    });

    // ── Category filter inside getEventsForPeriod ───────────────────────────

    it('filters by category name inside getEventsForPeriod', async () => {
      const catEvents: Event[] = [
        makeEvent({
          id: 'c1',
          dueDate: '2024-03-10T00:00:00.000Z',
          subscription: {
            id: 's1', name: 'Netflix', amount: 15, currency: 'EUR', frequency: 'monthly',
            startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '',
            category: { id: 'cat1', name: 'Streaming', icon: 'play', color: '#f00', isSystem: true, createdAt: '', updatedAt: '' },
          },
        }),
        makeEvent({
          id: 'c2',
          dueDate: '2024-03-10T00:00:00.000Z',
          subscription: {
            id: 's2', name: 'Spotify', amount: 10, currency: 'EUR', frequency: 'monthly',
            startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '',
            category: { id: 'cat2', name: 'Music', icon: 'music', color: '#0f0', isSystem: false, createdAt: '', updatedAt: '' },
          },
        }),
      ];
      mockEventService.getAll.mockResolvedValue(catEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('day', '2024-03-10T00:00:00.000Z', 'Streaming');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('c1');
    });

    // ── Events with no dueDate are excluded ─────────────────────────────────

    it('excludes events with no dueDate', async () => {
      const events: Event[] = [
        makeEvent({ id: 'no-due', dueDate: undefined as any }),
        makeEvent({ id: 'has-due', dueDate: '2024-03-10T00:00:00.000Z' }),
      ];
      mockEventService.getAll.mockResolvedValue(events);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('day', '2024-03-10T00:00:00.000Z');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('has-due');
    });

    // ── Events with invalid dueDate are excluded ─────────────────────────────

    it('excludes events with invalid dueDate string', async () => {
      const events: Event[] = [
        makeEvent({ id: 'bad-date', dueDate: 'not-a-date' }),
        makeEvent({ id: 'good-date', dueDate: '2024-03-10T00:00:00.000Z' }),
      ];
      mockEventService.getAll.mockResolvedValue(events);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForPeriod('day', '2024-03-10T00:00:00.000Z');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('good-date');
    });

    // ── Uses current date when dateString is omitted ─────────────────────────

    it('falls back to today when no dateString provided', async () => {
      const today = new Date().toISOString();
      const events: Event[] = [
        makeEvent({ id: 'today', dueDate: today }),
      ];
      mockEventService.getAll.mockResolvedValue(events);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      // No dateString → uses new Date() internally → today's event should match
      const found = result.current.getEventsForPeriod('day');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('today');
    });

    // ── Year aggregation without subscription.id falls back to event.id ──────

    it('aggregates by event.id when subscription id is absent', async () => {
      const yearEvents: Event[] = [
        makeEvent({
          id: 'ev-a',
          dueDate: '2024-01-01T00:00:00.000Z',
          subscription: { id: undefined as any, name: 'X', amount: 8, currency: 'EUR', frequency: 'monthly', startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '' },
        }),
        makeEvent({
          id: 'ev-b',
          dueDate: '2024-06-01T00:00:00.000Z',
          subscription: { id: undefined as any, name: 'X', amount: 8, currency: 'EUR', frequency: 'monthly', startDate: '', nextDueDate: '', status: 'active', userId: 'u1', createdAt: '', updatedAt: '' },
        }),
      ];
      mockEventService.getAll.mockResolvedValue(yearEvents);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      // Each event has a different id, so they should NOT be aggregated together
      const found = result.current.getEventsForPeriod('year', '2024-07-01');
      expect(found).toHaveLength(2);
    });
  });

  describe('getEventsForDate - edge cases', () => {
    it('excludes events where dueDate parses to NaN', async () => {
      const events: Event[] = [
        makeEvent({ id: 'bad', dueDate: 'invalid-date' }),
        makeEvent({ id: 'good', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];
      mockEventService.getAll.mockResolvedValue(events);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForDate('2024-02-15');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('good');
    });

    it('excludes events with no dueDate in getEventsForDate', async () => {
      const events: Event[] = [
        makeEvent({ id: 'no-due', dueDate: undefined as any }),
        makeEvent({ id: 'has-due', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];
      mockEventService.getAll.mockResolvedValue(events);

      const { result } = renderHook(() => useDashboard());
      await act(async () => {});

      const found = result.current.getEventsForDate('2024-02-15');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('has-due');
    });
  });
});
