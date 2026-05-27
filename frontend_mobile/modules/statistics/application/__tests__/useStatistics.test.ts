import { act, renderHook, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Module mocks — declared before any import so jest.mock hoisting takes effect
// ---------------------------------------------------------------------------

jest.mock('@/modules/dashboard/infrastructure/eventApi', () => ({
  eventService: { getAll: jest.fn() },
}));

jest.mock('@/modules/categories/infrastructure/categoryApi', () => ({
  categoryService: { getAll: jest.fn() },
}));

jest.mock('@/utils/eventFilter', () => ({
  isDateInPeriod: jest.fn(),
}));

// @/i18n is already mocked globally by jest.setup.js, but we override here
// for isolation so assertions on error messages are self-contained.
jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (k: string) => k },
}));

jest.mock('@/types/statistics', () => ({
  PERIOD_LABELS: { day: 'Day', week: 'Week', month: 'Month', year: 'Year' },
}));

// ---------------------------------------------------------------------------
// Imports — AFTER jest.mock declarations
// ---------------------------------------------------------------------------

import { useStatistics } from '@/modules/statistics/application/useStatistics';
import { eventService } from '@/modules/dashboard/infrastructure/eventApi';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';
import { isDateInPeriod } from '@/utils/eventFilter';
import type { Event, Category } from '@/services/api/types';

const mockEventService = eventService as jest.Mocked<typeof eventService>;
const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>;
const mockIsDateInPeriod = isDateInPeriod as jest.MockedFunction<typeof isDateInPeriod>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'evt-1',
  title: 'Test Event',
  dueDate: '2025-05-01T00:00:00.000Z',
  status: 'scheduled',
  subscriptionId: 'sub-1',
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  name: 'Netflix',
  icon: '🎬',
  color: '#e50914',
  isSystem: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: services resolve to empty arrays
    mockEventService.getAll.mockResolvedValue([]);
    mockCategoryService.getAll.mockResolvedValue([]);
    // Default: every event is in period
    mockIsDateInPeriod.mockReturnValue(true);
  });

  // -------------------------------------------------------------------------
  // 1. Initial state
  // -------------------------------------------------------------------------
  it('has loading=true, empty events and empty categories on first render', () => {
    // Keep services pending so loading stays true
    mockEventService.getAll.mockReturnValue(new Promise(() => {}));
    mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStatistics());

    expect(result.current.loading).toBe(true);
    // events / categories are internal — we verify loading state only
    expect(result.current.error).toBeNull();
    expect(result.current.activePeriod).toBe('month');
  });

  // -------------------------------------------------------------------------
  // 2. fetchData — success
  // -------------------------------------------------------------------------
  it('populates events and categories after fetchData resolves', async () => {
    const events = [makeEvent()];
    const categories = [makeCategory()];
    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue(categories);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    // loading must be false and no error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // getStatsForPeriod should reflect the loaded events
    // isDateInPeriod is mocked to return true so all events are included
    const stats = result.current.getStatsForPeriod('month');
    expect(stats.transactionCount).toBe(events.length);
  });

  // -------------------------------------------------------------------------
  // 3. fetchData — error (Error instance)
  // -------------------------------------------------------------------------
  it('sets error message when fetchData rejects with an Error', async () => {
    mockEventService.getAll.mockRejectedValue(new Error('network failure'));

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.error).toBe('network failure');
    expect(result.current.loading).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3b. fetchData — error (non-Error value)
  // -------------------------------------------------------------------------
  it('uses i18n fallback when fetchData rejects with a non-Error value', async () => {
    mockEventService.getAll.mockRejectedValue('server down');

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    // The hook calls i18n.t('errors.statisticsLoadFailed') — our mock returns the key
    expect(result.current.error).toBe('errors.statisticsLoadFailed');
  });

  // -------------------------------------------------------------------------
  // 4. fetchData — loading is false after completion
  // -------------------------------------------------------------------------
  it('sets loading=false after fetchData completes (success path)', async () => {
    mockEventService.getAll.mockResolvedValue([]);
    mockCategoryService.getAll.mockResolvedValue([]);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.loading).toBe(false);
  });

  it('sets loading=false after fetchData completes (failure path)', async () => {
    mockEventService.getAll.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.loading).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 5. setActivePeriod
  // -------------------------------------------------------------------------
  it('changes activePeriod when setActivePeriod is called', () => {
    const { result } = renderHook(() => useStatistics());

    expect(result.current.activePeriod).toBe('month');

    act(() => {
      result.current.setActivePeriod('year');
    });

    expect(result.current.activePeriod).toBe('year');
  });

  it('exposes all four period entries in timePeriods', () => {
    const { result } = renderHook(() => useStatistics());

    const keys = result.current.timePeriods.map((p) => p.key);
    expect(keys).toEqual(['day', 'week', 'month', 'year']);

    const labels = result.current.timePeriods.map((p) => p.label);
    expect(labels).toEqual(['Day', 'Week', 'Month', 'Year']);
  });

  // -------------------------------------------------------------------------
  // 6. getStatsForPeriod — no events
  // -------------------------------------------------------------------------
  it('returns zero stats when there are no events', async () => {
    mockEventService.getAll.mockResolvedValue([]);
    mockCategoryService.getAll.mockResolvedValue([]);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');

    expect(stats.totalExpenses).toBe(0);
    expect(stats.transactionCount).toBe(0);
    expect(stats.averageTransaction).toBe(0);
    expect(stats.categoryBreakdown).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 7. getStatsForPeriod — totals expenses
  // -------------------------------------------------------------------------
  it('correctly totals expenses across events in the period', async () => {
    const events: Event[] = [
      makeEvent({
        id: 'evt-1',
        subscription: {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      }),
      makeEvent({
        id: 'evt-2',
        subscription: {
          id: 'sub-2',
          userId: 'user-1',
          name: 'Spotify',
          amount: 10,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      }),
    ];

    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue([]);
    mockIsDateInPeriod.mockReturnValue(true);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');

    expect(stats.totalExpenses).toBe(25);
    expect(stats.transactionCount).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 8. getStatsForPeriod — averageTransaction
  // -------------------------------------------------------------------------
  it('calculates averageTransaction correctly', async () => {
    const events: Event[] = [
      makeEvent({
        id: 'evt-1',
        subscription: {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 30,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      }),
      makeEvent({
        id: 'evt-2',
        subscription: {
          id: 'sub-2',
          userId: 'user-1',
          name: 'Spotify',
          amount: 10,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      }),
    ];

    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue([]);
    mockIsDateInPeriod.mockReturnValue(true);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');

    expect(stats.averageTransaction).toBe(20); // (30 + 10) / 2
  });

  // -------------------------------------------------------------------------
  // 9. getStatsForPeriod — groups events by category
  // -------------------------------------------------------------------------
  it('groups events by category and sorts by total descending', async () => {
    const streamingCategory: Category = makeCategory({
      id: 'cat-1',
      name: 'Streaming',
      icon: '📺',
      color: '#ff0000',
    });
    const musicCategory: Category = makeCategory({
      id: 'cat-2',
      name: 'Music',
      icon: '🎵',
      color: '#00ff00',
    });

    const events: Event[] = [
      makeEvent({
        id: 'evt-1',
        subscription: {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          category: { id: 'cat-1', name: 'Streaming', icon: '📺', color: '#ff0000', isSystem: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        },
      }),
      makeEvent({
        id: 'evt-2',
        subscription: {
          id: 'sub-2',
          userId: 'user-1',
          name: 'Disney+',
          amount: 8,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          category: { id: 'cat-1', name: 'Streaming', icon: '📺', color: '#ff0000', isSystem: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        },
      }),
      makeEvent({
        id: 'evt-3',
        subscription: {
          id: 'sub-3',
          userId: 'user-1',
          name: 'Spotify',
          amount: 10,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          category: { id: 'cat-2', name: 'Music', icon: '🎵', color: '#00ff00', isSystem: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        },
      }),
    ];

    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue([streamingCategory, musicCategory]);
    mockIsDateInPeriod.mockReturnValue(true);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');

    expect(stats.categoryBreakdown).toHaveLength(2);

    // Streaming should be first (23 total > 10)
    expect(stats.categoryBreakdown[0].name).toBe('Streaming');
    expect(stats.categoryBreakdown[0].total).toBe(23);
    expect(stats.categoryBreakdown[0].count).toBe(2);
    expect(stats.categoryBreakdown[0].icon).toBe('📺');
    expect(stats.categoryBreakdown[0].color).toBe('#ff0000');

    // Music should be second
    expect(stats.categoryBreakdown[1].name).toBe('Music');
    expect(stats.categoryBreakdown[1].total).toBe(10);
    expect(stats.categoryBreakdown[1].count).toBe(1);
    expect(stats.categoryBreakdown[1].icon).toBe('🎵');
    expect(stats.categoryBreakdown[1].color).toBe('#00ff00');
  });

  // -------------------------------------------------------------------------
  // 10. getStatsForPeriod — events without dueDate or invalid dueDate
  // -------------------------------------------------------------------------
  it('excludes events without dueDate from period stats', async () => {
    const validEvent = makeEvent({ id: 'evt-1', dueDate: '2025-05-01T00:00:00.000Z' });
    // @ts-ignore — intentionally omit dueDate to test the guard
    const noDateEvent: Event = makeEvent({ id: 'evt-2', dueDate: undefined });

    mockEventService.getAll.mockResolvedValue([validEvent, noDateEvent]);
    mockCategoryService.getAll.mockResolvedValue([]);
    // Only return true for validEvent (isDateInPeriod is only called for events with a valid date)
    mockIsDateInPeriod.mockReturnValue(true);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');
    // Only the valid event is considered
    expect(stats.transactionCount).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 11. getStatsForPeriod — respects isDateInPeriod filter
  // -------------------------------------------------------------------------
  it('only includes events for which isDateInPeriod returns true', async () => {
    const events: Event[] = [
      makeEvent({ id: 'evt-1', dueDate: '2025-05-01T00:00:00.000Z' }),
      makeEvent({ id: 'evt-2', dueDate: '2025-04-01T00:00:00.000Z' }),
    ];

    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue([]);
    // Only the first event passes the period filter
    mockIsDateInPeriod.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');
    expect(stats.transactionCount).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 12. getStatsForPeriod — falls back to 'Autre' for events without category
  // -------------------------------------------------------------------------
  it('uses "Autre" as category name when subscription has no category', async () => {
    const events: Event[] = [
      makeEvent({
        id: 'evt-1',
        subscription: {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Unknown Service',
          amount: 5,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: '2025-01-01',
          nextDueDate: '2025-06-01',
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          // no category
        },
      }),
    ];

    mockEventService.getAll.mockResolvedValue(events);
    mockCategoryService.getAll.mockResolvedValue([]);
    mockIsDateInPeriod.mockReturnValue(true);

    const { result } = renderHook(() => useStatistics());

    await act(async () => {
      await result.current.fetchData();
    });

    const stats = result.current.getStatsForPeriod('month');
    expect(stats.categoryBreakdown[0].name).toBe('Autre');
    expect(stats.categoryBreakdown[0].icon).toBe('📁');
    expect(stats.categoryBreakdown[0].color).toBe('#6366f1');
  });
});
