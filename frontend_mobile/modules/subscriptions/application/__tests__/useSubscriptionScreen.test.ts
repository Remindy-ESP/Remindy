import { renderHook, act } from '@testing-library/react-native';
import { useSubscriptionScreen } from '@/modules/subscriptions/application/useSubscriptionScreen';
import { subscriptionService } from '@/modules/subscriptions/infrastructure/subscriptionApi';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';
import { reminderService } from '@/modules/notifications/infrastructure/reminderApi';
import type { Subscription, Category } from '@/services/api/types';

// ---------------------------------------------------------------------------
// useFocusEffect — simulate it via useEffect so the callback fires on mount
// ---------------------------------------------------------------------------
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => {
    require('react').useEffect(() => {
      cb();
    }, [cb]);
  }),
}));

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------
jest.mock('@/modules/subscriptions/infrastructure/subscriptionApi', () => ({
  subscriptionService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  },
}));

jest.mock('@/modules/categories/infrastructure/categoryApi', () => ({
  categoryService: {
    getAll: jest.fn(),
  },
}));

jest.mock('@/modules/notifications/infrastructure/reminderApi', () => ({
  reminderService: {
    getAll: jest.fn(),
    getBySubscription: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Context mocks (toast + showConfirm)
// ---------------------------------------------------------------------------
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(jest.fn(), {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
    info: jest.fn(),
  }),
}));

const mockShowConfirm = jest.fn();
jest.mock('@/context/ConfirmContext', () => ({
  showConfirm: (...args: any[]) => mockShowConfirm(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockSubscriptionService = subscriptionService as jest.Mocked<typeof subscriptionService>;
const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>;
const mockReminderService = reminderService as jest.Mocked<typeof reminderService>;

const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  userId: 'user-1',
  name: 'Netflix',
  amount: 15.99,
  currency: 'EUR',
  frequency: 'monthly',
  startDate: '2024-01-01T00:00:00.000Z',
  nextDueDate: '2024-02-01T00:00:00.000Z',
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  name: 'Streaming',
  icon: 'play',
  color: '#FF0000',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockCategories: Category[] = [
  makeCategory({ id: 'cat-1', name: 'Streaming' }),
  makeCategory({ id: 'cat-2', name: 'Music', isSystem: false }),
];

const mockSubscriptions: Subscription[] = [
  makeSubscription({ id: 'sub-1', name: 'Netflix', frequency: 'monthly', category: mockCategories[0], categoryId: 'cat-1' }),
  makeSubscription({ id: 'sub-2', name: 'Spotify', frequency: 'yearly', category: mockCategories[1], categoryId: 'cat-2' }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useSubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionService.getAll.mockResolvedValue(mockSubscriptions);
    mockCategoryService.getAll.mockResolvedValue(mockCategories);
    mockReminderService.getBySubscription.mockResolvedValue([]);
  });

  // ─── 1. Initial state ──────────────────────────────────────────────────────

  describe('initial state', () => {
    it('returns loading: true before any data is fetched', () => {
      // Keep promises pending so we can capture the initial synchronous state
      mockSubscriptionService.getAll.mockReturnValue(new Promise(() => {}));
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionScreen());

      expect(result.current.loading).toBe(true);
    });

    it('starts with empty subscriptions and categories', () => {
      mockSubscriptionService.getAll.mockReturnValue(new Promise(() => {}));
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionScreen());

      expect(result.current.subscriptions).toEqual([]);
      expect(result.current.categories).toEqual([]);
    });

    it('starts with null error', () => {
      mockSubscriptionService.getAll.mockReturnValue(new Promise(() => {}));
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionScreen());

      expect(result.current.error).toBeNull();
    });

    it('starts with modalVisible: false and no editingSubscription', () => {
      mockSubscriptionService.getAll.mockReturnValue(new Promise(() => {}));
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionScreen());

      expect(result.current.modalVisible).toBe(false);
      expect(result.current.editingSubscription).toBeNull();
    });

    it('starts with empty filter values', () => {
      mockSubscriptionService.getAll.mockReturnValue(new Promise(() => {}));
      mockCategoryService.getAll.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionScreen());

      expect(result.current.filterFrequency).toBe('');
      expect(result.current.filterCategoryId).toBe('');
    });
  });

  // ─── 2. Fetching data on mount ─────────────────────────────────────────────

  describe('data fetching on mount (via useFocusEffect)', () => {
    it('calls subscriptionService.getAll on mount', async () => {
      renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(mockSubscriptionService.getAll).toHaveBeenCalledTimes(1);
    });

    it('calls categoryService.getAll on mount', async () => {
      renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);
    });

    it('populates subscriptions and categories after a successful fetch', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.subscriptions).toEqual(mockSubscriptions);
      expect(result.current.categories).toEqual(mockCategories);
    });
  });

  // ─── 3. loading: false after fetch ────────────────────────────────────────

  describe('loading state after fetch', () => {
    it('sets loading: false after a successful fetch', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.loading).toBe(false);
    });

    it('sets loading: false even when the fetch fails', async () => {
      mockSubscriptionService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.loading).toBe(false);
    });
  });

  // ─── 4. Error state ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('sets error when subscriptionService.getAll rejects', async () => {
      mockSubscriptionService.getAll.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.error).not.toBeNull();
    });

    it('sets error when categoryService.getAll rejects', async () => {
      mockCategoryService.getAll.mockRejectedValue(new Error('Category fetch error'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.error).not.toBeNull();
    });

    it('keeps subscriptions empty when fetch fails', async () => {
      mockSubscriptionService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.subscriptions).toEqual([]);
    });
  });

  // ─── 5. filteredSubscriptions — no filter ─────────────────────────────────

  describe('filteredSubscriptions', () => {
    it('returns all subscriptions when no filter is set', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      expect(result.current.filteredSubscriptions).toHaveLength(mockSubscriptions.length);
    });

    // ─── 6. filter by frequency ──────────────────────────────────────────────

    it('filters subscriptions by frequency when filterFrequency is set', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.setFilterFrequency('monthly');
      });

      expect(result.current.filteredSubscriptions).toHaveLength(1);
      expect(result.current.filteredSubscriptions[0].id).toBe('sub-1');
    });

    it('returns empty array when no subscription matches the frequency filter', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.setFilterFrequency('weekly');
      });

      expect(result.current.filteredSubscriptions).toHaveLength(0);
    });

    // ─── 7. filter by category ───────────────────────────────────────────────

    it('filters subscriptions by categoryId when filterCategoryId is set', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.setFilterCategoryId('cat-2');
      });

      expect(result.current.filteredSubscriptions).toHaveLength(1);
      expect(result.current.filteredSubscriptions[0].id).toBe('sub-2');
    });

    it('applies both frequency and categoryId filters together', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.setFilterFrequency('monthly');
        result.current.setFilterCategoryId('cat-1');
      });

      expect(result.current.filteredSubscriptions).toHaveLength(1);
      expect(result.current.filteredSubscriptions[0].id).toBe('sub-1');
    });

    it('returns empty array when frequency and category filters have no common match', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        // sub-1 is monthly/cat-1, sub-2 is yearly/cat-2 — no overlap
        result.current.setFilterFrequency('monthly');
        result.current.setFilterCategoryId('cat-2');
      });

      expect(result.current.filteredSubscriptions).toHaveLength(0);
    });
  });

  // ─── 8. openAddModal ──────────────────────────────────────────────────────

  describe('openAddModal', () => {
    it('sets modalVisible to true', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.modalVisible).toBe(true);
    });

    it('clears editingSubscription', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      // First open the edit modal to set editingSubscription
      await act(async () => {
        await result.current.openEditModal(mockSubscriptions[0]);
      });

      expect(result.current.editingSubscription).not.toBeNull();

      // Now open add modal and confirm editingSubscription is cleared
      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.editingSubscription).toBeNull();
    });

    it('resets formData to defaults', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.description).toBe('');
      expect(result.current.formData.billingCycle).toBe('MONTHLY');
      expect(result.current.formData.reminderDays).toBe(3);
      expect(result.current.formData.isTrial).toBe(false);
    });

    it('sets categoryId to the first available category', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.formData.categoryId).toBe(mockCategories[0].id);
    });
  });

  // ─── 9. handleDelete — confirmed ──────────────────────────────────────────

  describe('handleDelete', () => {
    it('calls showConfirm with the subscription name', async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSubscriptionService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handleDelete(mockSubscriptions[0]);
      });

      expect(mockShowConfirm).toHaveBeenCalledTimes(1);
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ destructive: true }),
      );
    });

    it('calls subscriptionService.delete with the correct id when confirmed', async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSubscriptionService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handleDelete(mockSubscriptions[0]);
      });

      expect(mockSubscriptionService.delete).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.delete).toHaveBeenCalledWith('sub-1');
    });

    it('re-fetches data after a successful delete', async () => {
      mockShowConfirm.mockResolvedValue(true);
      mockSubscriptionService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      const callCountBefore = mockSubscriptionService.getAll.mock.calls.length;

      await act(async () => {
        await result.current.handleDelete(mockSubscriptions[0]);
      });

      expect(mockSubscriptionService.getAll.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    // ─── 10. handleDelete — cancelled ─────────────────────────────────────────

    it('does NOT call subscriptionService.delete when user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false);

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handleDelete(mockSubscriptions[0]);
      });

      expect(mockSubscriptionService.delete).not.toHaveBeenCalled();
    });

    it('calls showConfirm even when user cancels', async () => {
      mockShowConfirm.mockResolvedValue(false);

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handleDelete(mockSubscriptions[0]);
      });

      expect(mockShowConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 11. handlePauseResume — active subscription ──────────────────────────

  describe('handlePauseResume', () => {
    it('calls subscriptionService.pause for an active subscription', async () => {
      const activeSubscription = makeSubscription({ id: 'sub-active', status: 'active' });
      mockSubscriptionService.pause.mockResolvedValue({ ...activeSubscription, status: 'paused' });

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handlePauseResume(activeSubscription);
      });

      expect(mockSubscriptionService.pause).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.pause).toHaveBeenCalledWith('sub-active');
      expect(mockSubscriptionService.resume).not.toHaveBeenCalled();
    });

    it('re-fetches data after pausing a subscription', async () => {
      const activeSubscription = makeSubscription({ id: 'sub-active', status: 'active' });
      mockSubscriptionService.pause.mockResolvedValue({ ...activeSubscription, status: 'paused' });

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      const callCountBefore = mockSubscriptionService.getAll.mock.calls.length;

      await act(async () => {
        await result.current.handlePauseResume(activeSubscription);
      });

      expect(mockSubscriptionService.getAll.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    // ─── 12. handlePauseResume — paused subscription ─────────────────────────

    it('calls subscriptionService.resume for a paused subscription', async () => {
      const pausedSubscription = makeSubscription({ id: 'sub-paused', status: 'paused' });
      mockSubscriptionService.resume.mockResolvedValue({ ...pausedSubscription, status: 'active' });

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handlePauseResume(pausedSubscription);
      });

      expect(mockSubscriptionService.resume).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionService.resume).toHaveBeenCalledWith('sub-paused');
      expect(mockSubscriptionService.pause).not.toHaveBeenCalled();
    });

    it('calls subscriptionService.resume for a trial subscription (non-active status)', async () => {
      const trialSubscription = makeSubscription({ id: 'sub-trial', status: 'trial' });
      mockSubscriptionService.resume.mockResolvedValue({ ...trialSubscription, status: 'active' });

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handlePauseResume(trialSubscription);
      });

      expect(mockSubscriptionService.resume).toHaveBeenCalledWith('sub-trial');
    });

    it('calls toast.error when pause fails', async () => {
      const activeSubscription = makeSubscription({ id: 'sub-active', status: 'active' });
      mockSubscriptionService.pause.mockRejectedValue(new Error('Pause failed'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handlePauseResume(activeSubscription);
      });

      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    it('calls toast.error when resume fails', async () => {
      const pausedSubscription = makeSubscription({ id: 'sub-paused', status: 'paused' });
      mockSubscriptionService.resume.mockRejectedValue(new Error('Resume failed'));

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.handlePauseResume(pausedSubscription);
      });

      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
  });

  // ─── openEditModal ─────────────────────────────────────────────────────────

  describe('openEditModal', () => {
    it('sets editingSubscription and opens modal', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.openEditModal(mockSubscriptions[0]);
      });

      expect(result.current.editingSubscription).toEqual(mockSubscriptions[0]);
      expect(result.current.modalVisible).toBe(true);
    });

    it('pre-fills formData with the subscription values', async () => {
      const subscription = makeSubscription({
        id: 'sub-edit',
        name: 'Disney+',
        amount: 8.99,
        frequency: 'yearly',
        notes: 'Family plan',
        categoryId: 'cat-1',
      });

      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.openEditModal(subscription);
      });

      expect(result.current.formData.name).toBe('Disney+');
      expect(result.current.formData.description).toBe('Family plan');
      expect(result.current.formData.billingCycle).toBe('YEARLY');
      expect(result.current.formData.categoryId).toBe('cat-1');
    });

    it('fetches existing reminders when opening edit modal', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      await act(async () => {
        await result.current.openEditModal(mockSubscriptions[0]);
      });

      expect(mockReminderService.getBySubscription).toHaveBeenCalledWith('sub-1');
    });
  });

  // ─── fetchData re-calls services ──────────────────────────────────────────

  describe('fetchData', () => {
    it('can be called manually and re-fetches data', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      const initialCalls = mockSubscriptionService.getAll.mock.calls.length;

      await act(async () => {
        await result.current.fetchData();
      });

      expect(mockSubscriptionService.getAll.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('passes frequency filter to subscriptionService.getAll when set', async () => {
      const { result } = renderHook(() => useSubscriptionScreen());

      await act(async () => {});

      act(() => {
        result.current.setFilterFrequency('monthly');
      });

      await act(async () => {
        await result.current.fetchData();
      });

      const lastCall = mockSubscriptionService.getAll.mock.calls[
        mockSubscriptionService.getAll.mock.calls.length - 1
      ];
      expect(lastCall[0]).toMatchObject({ frequency: 'monthly' });
    });
  });
});
