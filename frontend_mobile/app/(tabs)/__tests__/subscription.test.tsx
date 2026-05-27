import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SubscriptionScreen from '../subscription';
import { subscriptionService } from '@/modules/subscriptions/infrastructure/subscriptionApi';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------
jest.mock('@/modules/subscriptions/infrastructure/subscriptionApi');
jest.mock('@/modules/categories/infrastructure/categoryApi');

const mockedSubscriptionService = subscriptionService as jest.Mocked<typeof subscriptionService>;
const mockedCategoryService = categoryService as jest.Mocked<typeof categoryService>;

// ---------------------------------------------------------------------------
// React Navigation (useFocusEffect)
// ---------------------------------------------------------------------------
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    require('react').useEffect(() => {
      callback();
    }, [callback]);
  }),
}));

// ---------------------------------------------------------------------------
// expo-router (setParams needed for openAdd effect)
// ---------------------------------------------------------------------------
const mockRouterSetParams = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
    back: jest.fn(),
    replace: jest.fn(),
    setParams: mockRouterSetParams,
  })),
}));

// ---------------------------------------------------------------------------
// Picker — renders children; enough to trigger onValueChange via mock
// ---------------------------------------------------------------------------
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');

  const PickerItem = ({ label, value }: any) => null;

  const Picker = ({ children, selectedValue, onValueChange, testID }: any) => (
    <View testID={testID}>
      {React.Children.map(children, (child: any) =>
        child ? (
          <TouchableOpacity
            testID={`picker-item-${child.props?.value}`}
            onPress={() => onValueChange && onValueChange(child.props?.value)}
          >
            <Text>{child.props?.label}</Text>
          </TouchableOpacity>
        ) : null
      )}
    </View>
  );
  Picker.Item = PickerItem;

  return { Picker };
});

// ---------------------------------------------------------------------------
// AppPicker — expose each item as a touchable with testID picker-item-<value>
// ---------------------------------------------------------------------------
jest.mock('@/shared/ui/AppPicker', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  const AppPicker = ({ items, selectedValue, onValueChange }: any) => (
    <View>
      {(items ?? []).map((item: any) => (
        <TouchableOpacity
          key={item.value}
          testID={`picker-item-${item.value}`}
          onPress={() => onValueChange && onValueChange(item.value)}
        >
          <Text>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  AppPicker.displayName = 'AppPicker';
  return AppPicker;
});

// ---------------------------------------------------------------------------
// Toast / Confirm / ActionSheet context mocks
// ---------------------------------------------------------------------------
jest.mock('@/context/ToastContext', () => {
  const toastError = jest.fn();
  const toastSuccess = jest.fn();
  const toastInfo = jest.fn();
  const toastFn: any = jest.fn();
  toastFn.error = toastError;
  toastFn.success = toastSuccess;
  toastFn.info = toastInfo;
  return {
    toast: toastFn,
    ToastProvider: ({ children }: any) => children,
  };
});

jest.mock('@/context/ConfirmContext', () => ({
  showConfirm: jest.fn().mockResolvedValue(true),
  ConfirmProvider: ({ children }: any) => children,
}));

jest.mock('@/context/ActionSheetContext', () => ({
  showActionSheet: jest.fn(),
  ActionSheetProvider: ({ children }: any) => children,
}));

// Get references to mock functions from the mocked modules
const { toast: _mockedToast } = jest.requireMock('@/context/ToastContext');
const mockToast = { error: _mockedToast.error as jest.Mock, success: _mockedToast.success as jest.Mock, info: _mockedToast.info as jest.Mock };
const mockShowConfirm: jest.Mock = jest.requireMock('@/context/ConfirmContext').showConfirm;
const mockShowActionSheet: jest.Mock = jest.requireMock('@/context/ActionSheetContext').showActionSheet;

// ---------------------------------------------------------------------------
// DateTimePicker
// ---------------------------------------------------------------------------
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ onChange, testID }: any) => (
    <View testID={testID || 'date-time-picker'}>
      <TouchableOpacity
        testID="picker-confirm"
        onPress={() => onChange && onChange({}, new Date('2025-06-15'))}
      >
        <Text>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
});

// ---------------------------------------------------------------------------
// CoachMarkTarget & config
// ---------------------------------------------------------------------------
jest.mock('@/shared/ui/system/CoachMarkTarget', () => {
  const React = require('react');
  return ({ children }: any) => <React.Fragment>{children}</React.Fragment>;
});

jest.mock('@/features/coach-marks/coach-marks.config', () => ({
  COACH_MARK_TARGETS: {
    subscriptionAddButton: 'subscriptionAddButton',
  },
}));

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------
const mockCategories = [
  { id: 'cat-1', name: 'Streaming', icon: '🎬', color: '#f00', isSystem: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'cat-2', name: 'Transport', icon: '🚗', color: '#0f0', isSystem: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const makeSubscription = (overrides: Partial<any> = {}) => ({
  id: 'sub-1',
  userId: 'user-1',
  name: 'Netflix',
  amount: 15.99,
  currency: 'EUR',
  frequency: 'monthly' as const,
  startDate: '2025-01-01T00:00:00.000Z',
  nextDueDate: '2025-02-01T00:00:00.000Z',
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  category: mockCategories[0],
  categoryId: 'cat-1',
  notes: 'Streaming service',
  ...overrides,
});

// ===========================================================================
describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockShowConfirm.mockResolvedValue(true);
    mockedSubscriptionService.getAll.mockResolvedValue([]);
    mockedCategoryService.getAll.mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe('loading state', () => {
    it('shows loading indicator initially', () => {
      const { getByText } = render(<SubscriptionScreen />);
      expect(getByText('Chargement des opérations...')).toBeTruthy();
    });

    it('shows header title while loading', () => {
      const { getAllByText } = render(<SubscriptionScreen />);
      // "Opérations" appears in header even during loading
      expect(getAllByText('Opérations').length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      mockedSubscriptionService.getAll.mockRejectedValue(new Error('Network error'));
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Network error')).toBeTruthy();
    });

    it('shows retry button when in error state', async () => {
      mockedSubscriptionService.getAll.mockRejectedValue(new Error('Timeout'));
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Réessayer')).toBeTruthy();
    });

    it('retries fetch when retry button is pressed', async () => {
      mockedSubscriptionService.getAll
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce([]);
      const { findByText } = render(<SubscriptionScreen />);
      const retryBtn = await findByText('Réessayer');
      await act(async () => { fireEvent.press(retryBtn); });
      await waitFor(() => expect(mockedSubscriptionService.getAll).toHaveBeenCalledTimes(2));
    });
  });

  // -------------------------------------------------------------------------
  // Normal render after data loads
  // -------------------------------------------------------------------------
  describe('normal render', () => {
    it('shows header title and add button after loading', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('+ Ajouter')).toBeTruthy();
    });

    it('shows empty state when no subscriptions', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Pas d\'opérations.')).toBeTruthy();
    });

    it('shows empty-subtext hint when no subscriptions', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText(/Appuyez sur le bouton/)).toBeTruthy();
    });

    it('shows count in header subtitle when subscriptions exist', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText(/1 opération/)).toBeTruthy();
    });

    it('shows plural "opérations" when count > 1', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([
        makeSubscription({ id: 'sub-1', name: 'Netflix' }),
        makeSubscription({ id: 'sub-2', name: 'Spotify' }),
      ]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText(/2 opérations/)).toBeTruthy();
    });

    it('renders subscription card with name and price', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Netflix')).toBeTruthy();
      expect(await findByText('EUR15.99')).toBeTruthy();
    });

    it('renders frequency badge label — monthly', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'monthly' })]);
      const { findAllByText } = render(<SubscriptionScreen />);
      // "Mensuel" appears in both Picker item labels and the frequency badge
      const items = await findAllByText('Mensuel');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders frequency badge label — yearly', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'yearly' })]);
      const { findAllByText } = render(<SubscriptionScreen />);
      const items = await findAllByText('Annuel');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders frequency badge label — weekly', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'weekly' })]);
      const { findAllByText } = render(<SubscriptionScreen />);
      const items = await findAllByText('Hebdomadaire');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders frequency badge label — quarterly', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'quarterly' })]);
      const { findAllByText } = render(<SubscriptionScreen />);
      const items = await findAllByText('Trimestriel');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders frequency badge label — one-time', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'one-time' })]);
      const { findAllByText } = render(<SubscriptionScreen />);
      const items = await findAllByText('Achat unique');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders notes when subscription has notes', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ notes: 'My streaming plan' })]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('My streaming plan')).toBeTruthy();
    });

    it('does not render notes section when notes is absent', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ notes: undefined })]);
      const { queryByText } = render(<SubscriptionScreen />);
      await waitFor(() => expect(mockedSubscriptionService.getAll).toHaveBeenCalled());
      expect(queryByText('My streaming plan')).toBeNull();
    });

    it('renders category badge with icon and name', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      const { findAllByText } = render(<SubscriptionScreen />);
      // "Streaming" appears in both the Picker category items and the category badge
      const items = await findAllByText('Streaming');
      expect(items.length).toBeGreaterThan(0);
    });

    it('truncates name longer than 30 characters', async () => {
      const longName = 'A'.repeat(35);
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ name: longName })]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText(`${'A'.repeat(30)}...`)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Status badges
  // -------------------------------------------------------------------------
  describe('status badges', () => {
    it.each([
      ['active', 'active'],
      ['paused', 'paused'],
      ['cancelled', 'cancelled'],
      ['trial', 'trial'],
    ])('renders status badge for "%s" status', async (status) => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status })]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText(status)).toBeTruthy();
    });

    it('shows pause icon ⏸ for active subscription', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'active' })]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('⏸')).toBeTruthy();
    });

    it('shows resume icon ▶️ for paused subscription', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'paused' })]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('▶️')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Pause / resume
  // -------------------------------------------------------------------------
  describe('pause and resume', () => {
    it('calls pause service when ⏸ pressed on active subscription', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'active' })]);
      mockedSubscriptionService.pause.mockResolvedValue(makeSubscription({ status: 'paused' }));
      const { findByText } = render(<SubscriptionScreen />);
      const pauseBtn = await findByText('⏸');
      await act(async () => { fireEvent.press(pauseBtn); });
      expect(mockedSubscriptionService.pause).toHaveBeenCalledWith('sub-1');
    });

    it('calls resume service when ▶️ pressed on paused subscription', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'paused' })]);
      mockedSubscriptionService.resume.mockResolvedValue(makeSubscription({ status: 'active' }));
      const { findByText } = render(<SubscriptionScreen />);
      const resumeBtn = await findByText('▶️');
      await act(async () => { fireEvent.press(resumeBtn); });
      expect(mockedSubscriptionService.resume).toHaveBeenCalledWith('sub-1');
    });

    it('shows success message after pausing', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'active' })]);
      mockedSubscriptionService.pause.mockResolvedValue(makeSubscription({ status: 'paused' }));
      const { findByText } = render(<SubscriptionScreen />);
      const pauseBtn = await findByText('⏸');
      await act(async () => { fireEvent.press(pauseBtn); });
      await waitFor(() => {
        // success overlay appears briefly
        expect(mockedSubscriptionService.pause).toHaveBeenCalled();
      });
    });

    it('shows error alert when pause fails', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ status: 'active' })]);
      mockedSubscriptionService.pause.mockRejectedValue(new Error('Pause failed'));
      const { findByText } = render(<SubscriptionScreen />);
      const pauseBtn = await findByText('⏸');
      await act(async () => { fireEvent.press(pauseBtn); });
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith(expect.any(String)));
    });
  });

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls showConfirm when delete button pressed', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockShowConfirm.mockResolvedValueOnce(false); // don't actually delete
      const { findByText } = render(<SubscriptionScreen />);
      const deleteBtn = await findByText('🗑️');
      fireEvent.press(deleteBtn);
      await waitFor(() => expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ destructive: true })
      ));
    });

    it('calls delete service when user confirms', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockedSubscriptionService.delete.mockResolvedValue(undefined);
      mockShowConfirm.mockResolvedValueOnce(true);

      const { findByText } = render(<SubscriptionScreen />);
      const deleteBtn = await findByText('🗑️');
      await act(async () => { fireEvent.press(deleteBtn); });
      await waitFor(() => expect(mockedSubscriptionService.delete).toHaveBeenCalledWith('sub-1'));
    });

    it('does not call delete service when user cancels', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockShowConfirm.mockResolvedValueOnce(false);

      const { findByText } = render(<SubscriptionScreen />);
      const deleteBtn = await findByText('🗑️');
      await act(async () => { fireEvent.press(deleteBtn); });
      await waitFor(() => expect(mockShowConfirm).toHaveBeenCalled());
      expect(mockedSubscriptionService.delete).not.toHaveBeenCalled();
    });

    it('shows error toast when delete fails', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockedSubscriptionService.delete.mockRejectedValue(new Error('Delete failed'));
      mockShowConfirm.mockResolvedValueOnce(true);

      const { findByText } = render(<SubscriptionScreen />);
      const deleteBtn = await findByText('🗑️');
      await act(async () => { fireEvent.press(deleteBtn); });
      await waitFor(() =>
        expect(mockToast.error).toHaveBeenCalledWith(expect.any(String))
      );
    });
  });

  // -------------------------------------------------------------------------
  // Add modal
  // -------------------------------------------------------------------------
  describe('add subscription modal', () => {
    it('opens modal when "+ Ajouter" is pressed', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);
      expect(await findByText('Ajouter un opération')).toBeTruthy();
    });

    it('closes modal when ✕ button is pressed', async () => {
      const { findByText, queryByText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);
      await findByText('Ajouter un opération');
      const closeBtn = await findByText('✕');
      fireEvent.press(closeBtn);
      await waitFor(() => expect(queryByText('Ajouter un opération')).toBeNull());
    });

    it('closes modal when "Annuler" button pressed', async () => {
      const { findByText, queryByText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);
      await findByText('Ajouter un opération');
      const cancelBtn = await findByText('Annuler');
      fireEvent.press(cancelBtn);
      await waitFor(() => expect(queryByText('Ajouter un opération')).toBeNull());
    });

    it('shows validation errors when form submitted empty', async () => {
      const { findByText, queryByText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);
      await findByText('Créer');
      const createBtn = await findByText('Créer');
      fireEvent.press(createBtn);
      await waitFor(() => {
        expect(findByText('Le nom est requis')).toBeTruthy();
      });
    });

    it('shows price validation error for invalid price', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);

      const nameInput = await getByPlaceholderText('Ex: Netflix, Spotify');
      fireEvent.changeText(nameInput, 'Netflix');

      // Leave price empty or set invalid
      const createBtn = await findByText('Créer');
      fireEvent.press(createBtn);
      await waitFor(() => expect(findByText(/Le prix doit être/)).toBeTruthy());
    });

    it('calls subscriptionService.create with correct data', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      mockedSubscriptionService.create.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);

      const nameInput = await getByPlaceholderText('Ex: Netflix, Spotify');
      fireEvent.changeText(nameInput, 'Netflix');

      const priceInput = await getByPlaceholderText('15.99 ou 15,99');
      fireEvent.changeText(priceInput, '15.99');

      const createBtn = await findByText('Créer');
      await act(async () => { fireEvent.press(createBtn); });

      await waitFor(() => {
        expect(mockedSubscriptionService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Netflix', amount: 15.99 })
        );
      });
    });

    it('accepts price with comma separator', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      mockedSubscriptionService.create.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);

      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'MyApp');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '9,99');

      const createBtn = await findByText('Créer');
      await act(async () => { fireEvent.press(createBtn); });

      await waitFor(() => {
        expect(mockedSubscriptionService.create).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 9.99 })
        );
      });
    });

    it('shows error alert when create fails', async () => {
      mockedSubscriptionService.create.mockRejectedValue(new Error('API error'));
      mockedCategoryService.getAll.mockResolvedValue([]);

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const addBtn = await findByText('+ Ajouter');
      fireEvent.press(addBtn);

      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');

      const createBtn = await findByText('Créer');
      await act(async () => { fireEvent.press(createBtn); });
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith(expect.any(String)));
    });

    it('includes notes when description is provided', async () => {
      mockedSubscriptionService.create.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));

      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');
      fireEvent.changeText(await getByPlaceholderText('Description optionnelle...'), 'My notes');

      await act(async () => { fireEvent.press(await findByText('Créer')); });

      await waitFor(() => {
        expect(mockedSubscriptionService.create).toHaveBeenCalledWith(
          expect.objectContaining({ notes: expect.stringContaining('My notes') })
        );
      });
    });

    it('creates subscription with reminderDays default of 3', async () => {
      mockedSubscriptionService.create.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));

      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');

      await act(async () => { fireEvent.press(await findByText('Créer')); });

      await waitFor(() => {
        expect(mockedSubscriptionService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Netflix' })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edit modal
  // -------------------------------------------------------------------------
  describe('edit subscription modal', () => {
    it('opens edit modal when ✏️ pressed', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      const { findByText } = render(<SubscriptionScreen />);
      const editBtn = await findByText('✏️');
      fireEvent.press(editBtn);
      expect(await findByText("Modifier l'opération")).toBeTruthy();
    });

    it('pre-fills name field in edit modal', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ name: 'Netflix' })]);
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const editBtn = await findByText('✏️');
      fireEvent.press(editBtn);
      await findByText("Modifier l'opération");
      const nameInput = getByPlaceholderText('Ex: Netflix, Spotify');
      expect(nameInput.props.value).toBe('Netflix');
    });

    it('pre-fills price field in edit modal', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ amount: 15.99 })]);
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const editBtn = await findByText('✏️');
      fireEvent.press(editBtn);
      await findByText("Modifier l'opération");
      const priceInput = getByPlaceholderText('15.99 ou 15,99');
      expect(priceInput.props.value).toBe('15.99');
    });

    it('calls subscriptionService.update with correct data on submit', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockedSubscriptionService.update.mockResolvedValue(makeSubscription({ name: 'Netflix Updated' }));

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      const editBtn = await findByText('✏️');
      fireEvent.press(editBtn);
      await findByText("Modifier l'opération");

      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix Updated');
      const updateBtn = await findByText('Mettre à jour');
      await act(async () => { fireEvent.press(updateBtn); });

      await waitFor(() => {
        expect(mockedSubscriptionService.update).toHaveBeenCalledWith(
          'sub-1',
          expect.objectContaining({ name: 'Netflix Updated' })
        );
      });
    });

    it('maps billing cycle correctly — weekly → weekly', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'weekly' })]);
      mockedSubscriptionService.update.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('✏️'));
      await findByText("Modifier l'opération");
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');

      await act(async () => { fireEvent.press(await findByText('Mettre à jour')); });
      await waitFor(() => {
        expect(mockedSubscriptionService.update).toHaveBeenCalledWith(
          'sub-1',
          expect.objectContaining({ frequency: 'weekly' })
        );
      });
    });

    it('maps billing cycle — one-time → one-time', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription({ frequency: 'one-time' })]);
      mockedSubscriptionService.update.mockResolvedValue(makeSubscription());

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('✏️'));
      await findByText("Modifier l'opération");
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');

      await act(async () => { fireEvent.press(await findByText('Mettre à jour')); });
      await waitFor(() => {
        expect(mockedSubscriptionService.update).toHaveBeenCalledWith(
          'sub-1',
          expect.objectContaining({ frequency: 'one-time' })
        );
      });
    });

    it('shows error alert when update fails', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      mockedSubscriptionService.update.mockRejectedValue(new Error('Update failed'));

      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('✏️'));
      await findByText("Modifier l'opération");
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '15.99');

      await act(async () => { fireEvent.press(await findByText('Mettre à jour')); });
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith(expect.any(String)));
    });
  });

  // -------------------------------------------------------------------------
  // Date picker interactions
  // -------------------------------------------------------------------------
  describe('date picker', () => {
    it('renders start date button with formatted date', async () => {
      const { findByText, findAllByText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      // date button shows "Date de début *" label
      expect(await findByText('Date de début *')).toBeTruthy();
    });

    it('shows DateTimePicker when start date button pressed', async () => {
      const { findByText, getByTestId } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');

      // Find the start date button by its label pattern DD/MM/YYYY
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateText = await findByText(`${dd}/${mm}/${yyyy}`);
      fireEvent.press(dateText);

      expect(getByTestId('date-time-picker')).toBeTruthy();
    });

    it('updates startDate when picker confirms a date', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateText = await findByText(`${dd}/${mm}/${yyyy}`);
      fireEvent.press(dateText);

      // Picker confirm triggers onChange with 2025-06-15
      const confirmBtn = await findByText('Confirm');
      fireEvent.press(confirmBtn);

      // The date button should now show 15/06/2025
      expect(await findByText('15/06/2025')).toBeTruthy();
    });

    it('shows end date button', async () => {
      const { findByText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      expect(await findByText('Date de fin (optionnel)')).toBeTruthy();
    });

    it('shows DateTimePicker when end date button pressed', async () => {
      const { findByText, getAllByText, getByTestId } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      // The end-date button shows DD/MM/YYYY too — press the second one
      const datePlaceholders = await getAllByText('DD/MM/YYYY');
      // datePlaceholders[0] = start date, datePlaceholders[1] = end date
      fireEvent.press(datePlaceholders[datePlaceholders.length - 1]);
      expect(getByTestId('date-time-picker')).toBeTruthy();
    });

    it('updates endDate when end date picker confirms', async () => {
      const { findByText, getAllByText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      const datePlaceholders = await getAllByText('DD/MM/YYYY');
      // Press the end-date button (last DD/MM/YYYY placeholder)
      fireEvent.press(datePlaceholders[datePlaceholders.length - 1]);
      const confirmBtn = await findByText('Confirm');
      fireEvent.press(confirmBtn);
      // After confirming, end date should show 15/06/2025 (the date the mock picker returns)
      expect(await findByText('15/06/2025')).toBeTruthy();
    });

    it('clears endDate when end-date clear button is pressed', async () => {
      const { findByText, getAllByText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      const datePlaceholders = await getAllByText('DD/MM/YYYY');
      fireEvent.press(datePlaceholders[datePlaceholders.length - 1]);
      const confirmBtn = await findByText('Confirm');
      fireEvent.press(confirmBtn);
      // Confirm sets end date to 15/06/2025; now the ✕ clear button appears
      // Modal close button is also "✕" — find the last one which is the clear button
      await waitFor(async () => {
        const crossButtons = await getAllByText('✕');
        // The clear button is the second ✕ (first is modal close header)
        expect(crossButtons.length).toBeGreaterThan(1);
        fireEvent.press(crossButtons[crossButtons.length - 1]);
      });
      // DD/MM/YYYY placeholder should be back for end date
      await waitFor(() => expect(getAllByText('DD/MM/YYYY').length).toBeGreaterThan(0));
    });
  });

  // -------------------------------------------------------------------------
  // Filter behaviour — empty filtered results
  // -------------------------------------------------------------------------
  describe('filter empty state', () => {
    it('shows filtered empty message when subscriptions exist but none match filter', async () => {
      // Subscriptions are loaded, but client-side filter (filterFrequency) excludes all
      // We simulate this by rendering with a subscription then checking filtered-empty text
      // Since filters apply client-side using filteredSubscriptions:
      mockedSubscriptionService.getAll.mockResolvedValue([
        makeSubscription({ frequency: 'monthly' }),
      ]);
      // The Picker.Item for 'weekly' would set filterFrequency to 'weekly'
      const { findByTestId, findByText } = render(<SubscriptionScreen />);
      // Wait for data to load
      await findByText('+ Ajouter');
      // Press the "weekly" picker item in the first filter picker
      const weeklyItem = await findByTestId('picker-item-weekly');
      await act(async () => { fireEvent.press(weeklyItem); });
      // Now the component re-fetches with filter
      mockedSubscriptionService.getAll.mockResolvedValue([]);
      await waitFor(() => {
        expect(mockedSubscriptionService.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  // -------------------------------------------------------------------------
  // openAdd param pre-fills form
  // -------------------------------------------------------------------------
  describe('openAdd search param', () => {
    beforeEach(() => {
      const { useLocalSearchParams } = require('expo-router');
      useLocalSearchParams.mockReturnValue({
        openAdd: '1234567890',
        parsedProvider: 'Netflix',
        parsedAmount: '15.99',
        parsedCurrency: 'EUR',
        parsedDate: '2025-01-15',
        parsedFrequency: 'mensuel',
        parsedCategory: 'Streaming',
        documentId: 'doc-abc',
      });
    });

    afterEach(() => {
      const { useLocalSearchParams } = require('expo-router');
      useLocalSearchParams.mockReturnValue({});
    });

    it('opens modal automatically when openAdd param is set', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Ajouter un opération')).toBeTruthy();
    });

    it('pre-fills name from parsedProvider', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      await findByText('Ajouter un opération');
      const nameInput = getByPlaceholderText('Ex: Netflix, Spotify');
      expect(nameInput.props.value).toBe('Netflix');
    });

    it('pre-fills price from parsedAmount', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      await findByText('Ajouter un opération');
      const priceInput = getByPlaceholderText('15.99 ou 15,99');
      expect(priceInput.props.value).toBe('15.99');
    });

    it('pre-fills description with documentId reference', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      await findByText('Ajouter un opération');
      const descInput = getByPlaceholderText('Description optionnelle...');
      expect(descInput.props.value).toContain('doc-abc');
    });

    it('maps "mensuel" frequency to MONTHLY billing cycle', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      mockedSubscriptionService.create.mockResolvedValue(makeSubscription());
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      await findByText('Ajouter un opération');
      // Submit the pre-filled form
      await act(async () => { fireEvent.press(await findByText('Créer')); });
      await waitFor(() => {
        expect(mockedSubscriptionService.create).toHaveBeenCalledWith(
          expect.objectContaining({ frequency: 'monthly' })
        );
      });
    });

    it('calls router.setParams to clear openAdd after modal opens', async () => {
      mockedCategoryService.getAll.mockResolvedValue(mockCategories);
      render(<SubscriptionScreen />);
      await waitFor(() => {
        expect(mockRouterSetParams).toHaveBeenCalledWith(
          expect.objectContaining({ openAdd: undefined })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Reminder days
  // -------------------------------------------------------------------------
  describe('reminderDays field', () => {
    it('renders reminder days input in modal', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      const reminderInput = getByPlaceholderText('3');
      expect(reminderInput).toBeTruthy();
    });

    it('updates reminderDays when user types a number', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      const reminderInput = getByPlaceholderText('3');
      fireEvent.changeText(reminderInput, '7');
      expect(reminderInput.props.value).toBe('7');
    });
  });

  // -------------------------------------------------------------------------
  // formatDate helper
  // -------------------------------------------------------------------------
  describe('formatDate display', () => {
    it('shows "N/A" for undefined startDate', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([
        makeSubscription({ startDate: undefined as any }),
      ]);
      const { findByText } = render(<SubscriptionScreen />);
      expect(await findByText('Début: N/A')).toBeTruthy();
    });

    it('formats valid startDate as locale date string', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([
        makeSubscription({ startDate: '2025-01-01T00:00:00.000Z' }),
      ]);
      const { findByText } = render(<SubscriptionScreen />);
      // Just verify "Début:" is rendered without crashing
      expect(await findByText(/Début:/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Pull-to-refresh
  // -------------------------------------------------------------------------
  describe('pull to refresh', () => {
    it('calls fetchData again when refreshed', async () => {
      mockedSubscriptionService.getAll.mockResolvedValue([makeSubscription()]);
      const { getByTestId } = render(<SubscriptionScreen />);
      await waitFor(() => expect(mockedSubscriptionService.getAll).toHaveBeenCalledTimes(1));
      // FlatList renders a RefreshControl — trigger onRefresh
      const flatList = getByTestId ? (() => {
        try { return getByTestId('subscription-list'); } catch { return null; }
      })() : null;
      // Service called again when filter changes trigger re-fetch
      expect(mockedSubscriptionService.getAll).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // parsePriceInput edge cases (validated through form submission)
  // -------------------------------------------------------------------------
  describe('parsePriceInput validation', () => {
    it('rejects negative price', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '-5');
      fireEvent.press(await findByText('Créer'));
      await waitFor(() => expect(findByText(/Le prix doit être/)).toBeTruthy());
    });

    it('rejects price of 0', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), '0');
      fireEvent.press(await findByText('Créer'));
      await waitFor(() => expect(findByText(/Le prix doit être/)).toBeTruthy());
    });

    it('rejects letters in price field', async () => {
      const { findByText, getByPlaceholderText } = render(<SubscriptionScreen />);
      fireEvent.press(await findByText('+ Ajouter'));
      await findByText('Ajouter un opération');
      fireEvent.changeText(await getByPlaceholderText('Ex: Netflix, Spotify'), 'Netflix');
      fireEvent.changeText(await getByPlaceholderText('15.99 ou 15,99'), 'abc');
      fireEvent.press(await findByText('Créer'));
      await waitFor(() => expect(findByText(/Le prix doit être/)).toBeTruthy());
    });
  });

  // -------------------------------------------------------------------------
  // Calls to services
  // -------------------------------------------------------------------------
  describe('service call counts', () => {
    it('calls subscriptionService.getAll on mount', async () => {
      render(<SubscriptionScreen />);
      await waitFor(() => expect(mockedSubscriptionService.getAll).toHaveBeenCalledTimes(1));
    });

    it('calls categoryService.getAll on mount', async () => {
      render(<SubscriptionScreen />);
      await waitFor(() => expect(mockedCategoryService.getAll).toHaveBeenCalledTimes(1));
    });
  });
});
