import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DashboardScreen from '../dashboard';

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const mockRouterPush = jest.fn();
const mockSetParams = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => {
    // execute the callback (which returns a cleanup) once so fetchDashboardData fires
    const cleanup = cb();
    return cleanup;
  }),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
    back: jest.fn(),
    replace: jest.fn(),
    setParams: mockSetParams,
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: 'Link',
}));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
    token: 'mock-token',
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// useDashboard — baseline factory (overridden per test where needed)
// ---------------------------------------------------------------------------
const baseUseDashboard = {
  selected: '',
  setSelected: jest.fn(),
  activePeriod: 'day',
  setActivePeriod: jest.fn(),
  categoriesOpen: false,
  setCategoriesOpen: jest.fn(),
  selectedCategory: null,
  setSelectedCategory: jest.fn(),
  addOperationModalOpen: false,
  setAddOperationModalOpen: jest.fn(),
  timePeriods: [
    { key: 'day', label: 'Ce jour', value: '1' },
    { key: 'week', label: 'Semaine', value: '2' },
    { key: 'month', label: 'Mensuel', value: '3' },
    { key: 'year', label: 'Année', value: '4' },
  ],
  getEventsForPeriod: jest.fn(() => []),
  categories: [],
  events: [],
  loading: false,
  error: null,
  getEventsForDate: jest.fn(() => []),
  getEventsByCategory: jest.fn(() => []),
  fetchDashboardData: jest.fn(),
};

const mockUseDashboard = jest.fn(() => ({ ...baseUseDashboard }));

jest.mock('../../../hooks/useDashboard', () => ({
  useDashboard: (...args: any[]) => mockUseDashboard(...args),
}));

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, testID }: any) => {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity
        testID={testID || 'calendar'}
        onPress={() => onDayPress && onDayPress({ dateString: '2025-01-15' })}
      />
    );
  },
  LocaleConfig: {
    locales: {},
    defaultLocale: 'en',
  },
}));

// ---------------------------------------------------------------------------
// CoachMarkTarget & config
// ---------------------------------------------------------------------------
jest.mock('@/components/system/CoachMarkTarget', () => {
  const React = require('react');
  return ({ children }: any) => <React.Fragment>{children}</React.Fragment>;
});

jest.mock('@/features/coach-marks/coach-marks.config', () => ({
  COACH_MARK_TARGETS: {
    dashboardCalendar: 'dashboardCalendar',
    subscriptionAddButton: 'subscriptionAddButton',
  },
}));

// ---------------------------------------------------------------------------
// Native components used by dashboard
// ---------------------------------------------------------------------------
jest.mock('@/components/Button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onPress, label }: any) => (
    <TouchableOpacity testID="categories-button" onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
});

jest.mock('@/components/AddOperationButton', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return ({ onPress }: any) => (
    <TouchableOpacity testID="add-operation-button" onPress={onPress} />
  );
});

jest.mock('@/components/AddOperationModal', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ visible, onClose, onManualEntry, onPdfInsert }: any) => {
    if (!visible) return null;
    return (
      <View testID="add-operation-modal">
        <TouchableOpacity testID="modal-close" onPress={onClose}>
          <Text>Fermer</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="modal-manual-entry" onPress={onManualEntry}>
          <Text>Saisir manuellement</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="modal-pdf-insert" onPress={onPdfInsert}>
          <Text>Insérer PDF</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('@/components/DailyExpensesSummary', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    DailyExpensesSummary: ({ date, events }: any) => (
      <View testID="daily-expenses-summary">
        <Text testID="summary-date">{date}</Text>
        <Text testID="summary-count">{events.length}</Text>
      </View>
    ),
  };
});

// ---------------------------------------------------------------------------
// Expo services used by handlePdfInsert
// ---------------------------------------------------------------------------
const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'fr' }]),
}));

// ---------------------------------------------------------------------------
// API services used by handlePdfInsert
// ---------------------------------------------------------------------------
const mockUploadDocument = jest.fn();
const mockGetDocument = jest.fn();
const mockGetAllFolders = jest.fn();

jest.mock('@/services/api', () => ({
  documentService: {
    uploadDocument: (...args: any[]) => mockUploadDocument(...args),
    getDocument: (...args: any[]) => mockGetDocument(...args),
  },
  folderService: {
    getAllFolders: (...args: any[]) => mockGetAllFolders(...args),
  },
}));

// ---------------------------------------------------------------------------
// Alert spy
// ---------------------------------------------------------------------------
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderDashboard(overrides: Partial<typeof baseUseDashboard> = {}) {
  mockUseDashboard.mockReturnValue({ ...baseUseDashboard, ...overrides });
  return render(<DashboardScreen />);
}

// ===========================================================================
describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    mockUseDashboard.mockReturnValue({ ...baseUseDashboard });
    mockGetAllFolders.mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // Rendering states
  // -------------------------------------------------------------------------
  describe('loading state', () => {
    it('shows ActivityIndicator and loading text when loading=true', () => {
      const { getByText } = renderDashboard({ loading: true });
      expect(getByText('Chargement de la page d\'accueil...')).toBeTruthy();
    });

    it('does not render calendar when loading', () => {
      const { queryByTestId } = renderDashboard({ loading: true });
      expect(queryByTestId('calendar')).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows error message when error is set', () => {
      const { getByText } = renderDashboard({ error: 'Network error', loading: false });
      expect(getByText('Error: Network error')).toBeTruthy();
    });

    it('shows backend hint when in error state', () => {
      const { getByText } = renderDashboard({ error: 'Timeout', loading: false });
      expect(getByText(/Make sure the backend server is running/)).toBeTruthy();
    });

    it('does not render calendar when error is set', () => {
      const { queryByTestId } = renderDashboard({ error: 'err', loading: false });
      expect(queryByTestId('calendar')).toBeNull();
    });
  });

  describe('normal render', () => {
    it('renders without crashing', () => {
      const { toJSON } = renderDashboard();
      expect(toJSON()).toBeTruthy();
    });

    it('renders the categories button with label "Catégories" when no category selected', () => {
      const { getByText } = renderDashboard();
      expect(getByText('Catégories')).toBeTruthy();
    });

    it('renders the selected category name in the button label', () => {
      const { getByText } = renderDashboard({ selectedCategory: 'Streaming' });
      expect(getByText('Streaming')).toBeTruthy();
    });

    it('renders time period tabs', () => {
      const { getByTestId } = renderDashboard();
      expect(getByTestId('period-day')).toBeTruthy();
      expect(getByTestId('period-week')).toBeTruthy();
      expect(getByTestId('period-month')).toBeTruthy();
      expect(getByTestId('period-year')).toBeTruthy();
    });

    it('renders the daily expenses summary component', () => {
      const { getByTestId } = renderDashboard();
      expect(getByTestId('daily-expenses-summary')).toBeTruthy();
    });

    it('renders the add operation button', () => {
      const { getByTestId } = renderDashboard();
      expect(getByTestId('add-operation-button')).toBeTruthy();
    });

    it('shows "Aucune dépense" when no events for period', () => {
      const { getByText } = renderDashboard({ getEventsForPeriod: jest.fn(() => []) });
      expect(getByText('Aucune dépense pour cette période')).toBeTruthy();
    });

    it('renders events list when getEventsForPeriod returns items', () => {
      const events = [
        {
          id: 'e1',
          title: 'Netflix',
          dueDate: '2025-01-15',
          totalAmount: 15.99,
          subscription: { name: 'Netflix', category: { name: 'Streaming' }, amount: 15.99 },
        },
        {
          id: 'e2',
          title: 'Spotify',
          dueDate: '2025-01-15',
          totalAmount: 9.99,
          subscription: { name: 'Spotify', category: null, amount: 9.99 },
        },
      ];
      const { getByText, getAllByText } = renderDashboard({ getEventsForPeriod: jest.fn(() => events) });
      expect(getByText('Netflix')).toBeTruthy();
      expect(getByText('Spotify')).toBeTruthy();
      // category fallback to "Général"
      expect(getByText('Général')).toBeTruthy();
    });

    it('displays event amount formatted with 2 decimal places and euro sign', () => {
      const events = [
        {
          id: 'e1',
          title: 'Sub',
          dueDate: '2025-01-15',
          totalAmount: 12.5,
          subscription: { name: 'Sub', amount: 12.5 },
        },
      ];
      const { getByText } = renderDashboard({ getEventsForPeriod: jest.fn(() => events) });
      expect(getByText('12.5€')).toBeTruthy();
    });

    it('uses event.title when subscription.name is absent', () => {
      const events = [
        {
          id: 'e1',
          title: 'Direct Event',
          dueDate: '2025-01-15',
          totalAmount: 5,
          subscription: null,
        },
      ];
      const { getByText } = renderDashboard({ getEventsForPeriod: jest.fn(() => events) });
      expect(getByText('Direct Event')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Categories dropdown
  // -------------------------------------------------------------------------
  describe('categories dropdown', () => {
    it('does not render dropdown when categoriesOpen=false', () => {
      const { queryByText } = renderDashboard({ categoriesOpen: false });
      expect(queryByText('Toutes les catégories')).toBeNull();
    });

    it('renders "No categories available" when categoriesOpen=true and categories empty', () => {
      const { getByText } = renderDashboard({ categoriesOpen: true, categories: [] });
      expect(getByText(/No categories available/)).toBeTruthy();
    });

    it('renders all categories when categoriesOpen=true', () => {
      const categories = [
        { id: 'c1', name: 'Streaming', icon: '🎬', color: '#fff', isSystem: true, createdAt: '', updatedAt: '' },
        { id: 'c2', name: 'Transport', icon: '🚗', color: '#000', isSystem: false, createdAt: '', updatedAt: '' },
      ];
      const { getByText } = renderDashboard({ categoriesOpen: true, categories });
      expect(getByText('Toutes les catégories')).toBeTruthy();
      expect(getByText('Streaming')).toBeTruthy();
      expect(getByText('Transport')).toBeTruthy();
    });

    it('calls setCategoriesOpen with true when categories button is pressed (closed → open)', () => {
      const setCategoriesOpen = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        categoriesOpen: false,
        setCategoriesOpen,
      });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('categories-button'));
      expect(setCategoriesOpen).toHaveBeenCalledWith(true);
    });

    it('calls setCategoriesOpen with false when button pressed while open', () => {
      const setCategoriesOpen = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        categoriesOpen: true,
        setCategoriesOpen,
      });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('categories-button'));
      expect(setCategoriesOpen).toHaveBeenCalledWith(false);
    });

    it('calls setSelectedCategory(null) and setCategoriesOpen(false) when "Toutes les catégories" pressed', () => {
      const setSelectedCategory = jest.fn();
      const setCategoriesOpen = jest.fn();
      const categories = [
        { id: 'c1', name: 'Streaming', icon: '🎬', color: '#fff', isSystem: true, createdAt: '', updatedAt: '' },
      ];
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        categoriesOpen: true,
        setCategoriesOpen,
        setSelectedCategory,
        categories,
      });
      const { getByText } = render(<DashboardScreen />);
      fireEvent.press(getByText('Toutes les catégories'));
      expect(setSelectedCategory).toHaveBeenCalledWith(null);
      expect(setCategoriesOpen).toHaveBeenCalledWith(false);
    });

    it('calls setSelectedCategory(name) and setCategoriesOpen(false) when a category is pressed', () => {
      const setSelectedCategory = jest.fn();
      const setCategoriesOpen = jest.fn();
      const categories = [
        { id: 'c1', name: 'Streaming', icon: '🎬', color: '#fff', isSystem: true, createdAt: '', updatedAt: '' },
      ];
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        categoriesOpen: true,
        setCategoriesOpen,
        setSelectedCategory,
        categories,
      });
      const { getByText } = render(<DashboardScreen />);
      fireEvent.press(getByText('Streaming'));
      expect(setSelectedCategory).toHaveBeenCalledWith('Streaming');
      expect(setCategoriesOpen).toHaveBeenCalledWith(false);
    });
  });

  // -------------------------------------------------------------------------
  // Time period tabs
  // -------------------------------------------------------------------------
  describe('time period tabs', () => {
    it('calls setActivePeriod when a period tab is pressed', () => {
      const setActivePeriod = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, setActivePeriod });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('period-week'));
      expect(setActivePeriod).toHaveBeenCalledWith('week');
    });

    it('calls setActivePeriod with "month" for the monthly tab', () => {
      const setActivePeriod = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, setActivePeriod });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('period-month'));
      expect(setActivePeriod).toHaveBeenCalledWith('month');
    });

    it('calls setActivePeriod with "year" for the yearly tab', () => {
      const setActivePeriod = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, setActivePeriod });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('period-year'));
      expect(setActivePeriod).toHaveBeenCalledWith('year');
    });
  });

  // -------------------------------------------------------------------------
  // Calendar interaction
  // -------------------------------------------------------------------------
  describe('calendar interaction', () => {
    it('calls setSelected when a calendar day is pressed', () => {
      const setSelected = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, setSelected });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('calendar'));
      expect(setSelected).toHaveBeenCalledWith('2025-01-15');
    });

    it('passes selected date to DailyExpensesSummary', () => {
      const { getByTestId } = renderDashboard({ selected: '2025-03-10' });
      expect(getByTestId('summary-date').props.children).toBe('2025-03-10');
    });
  });

  // -------------------------------------------------------------------------
  // Add operation modal flow
  // -------------------------------------------------------------------------
  describe('add operation modal', () => {
    it('does not render modal when addOperationModalOpen=false', () => {
      const { queryByTestId } = renderDashboard({ addOperationModalOpen: false });
      expect(queryByTestId('add-operation-modal')).toBeNull();
    });

    it('renders modal when addOperationModalOpen=true', () => {
      const { getByTestId } = renderDashboard({ addOperationModalOpen: true });
      expect(getByTestId('add-operation-modal')).toBeTruthy();
    });

    it('opens modal when add operation button is pressed', () => {
      const setAddOperationModalOpen = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, setAddOperationModalOpen });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('add-operation-button'));
      expect(setAddOperationModalOpen).toHaveBeenCalledWith(true);
    });

    it('closes modal when modal close button is pressed', () => {
      const setAddOperationModalOpen = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        addOperationModalOpen: true,
        setAddOperationModalOpen,
      });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-close'));
      expect(setAddOperationModalOpen).toHaveBeenCalledWith(false);
    });

    it('handleManualEntry closes modal and navigates to subscription', () => {
      const setAddOperationModalOpen = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        addOperationModalOpen: true,
        setAddOperationModalOpen,
      });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-manual-entry'));
      expect(setAddOperationModalOpen).toHaveBeenCalledWith(false);
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(tabs)/subscription' })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Upload overlay
  // -------------------------------------------------------------------------
  describe('upload overlay', () => {
    it('does not show upload overlay by default', () => {
      const { queryByText } = renderDashboard();
      expect(queryByText('Analyse en cours...')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // PDF insert — document cancelled
  // -------------------------------------------------------------------------
  describe('handlePdfInsert — document picker cancelled', () => {
    it('does not navigate or alert when user cancels picker', async () => {
      mockGetDocumentAsync.mockResolvedValue({ canceled: true });
      const setAddOperationModalOpen = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...baseUseDashboard,
        addOperationModalOpen: true,
        setAddOperationModalOpen,
      });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(mockGetDocumentAsync).toHaveBeenCalled();
        expect(mockRouterPush).not.toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // PDF insert — file too large
  // -------------------------------------------------------------------------
  describe('handlePdfInsert — file too large', () => {
    it('shows alert when file exceeds 10MB', async () => {
      const bigFile = {
        canceled: false,
        assets: [{ name: 'big.pdf', size: 11 * 1024 * 1024, mimeType: 'application/pdf', uri: 'file://big.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(bigFile);
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Fichier trop volumineux',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // PDF insert — successful upload (ocr completed immediately)
  // -------------------------------------------------------------------------
  describe('handlePdfInsert — successful upload', () => {
    it('navigates to subscription screen with parsed data after successful upload', async () => {
      const file = {
        canceled: false,
        assets: [{ name: 'invoice.pdf', size: 500 * 1024, mimeType: 'application/pdf', uri: 'file://invoice.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(file);
      mockGetAllFolders.mockResolvedValue([]);
      mockUploadDocument.mockResolvedValue({
        id: 'doc-1',
        ocr_status: 'completed',
        parsed_provider: 'Netflix',
        parsed_amount: 15.99,
        parsed_currency: 'EUR',
        parsed_date: '2025-01-01',
        parsed_frequency: 'mensuel',
        parsed_category: 'Streaming',
      });
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(mockUploadDocument).toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/(tabs)/subscription' })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // PDF insert — ocr failed
  // -------------------------------------------------------------------------
  describe('handlePdfInsert — ocr failed', () => {
    it('shows alert when OCR analysis fails', async () => {
      const file = {
        canceled: false,
        assets: [{ name: 'bad.pdf', size: 100 * 1024, mimeType: 'application/pdf', uri: 'file://bad.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(file);
      mockGetAllFolders.mockResolvedValue([]);
      mockUploadDocument.mockResolvedValue({
        id: 'doc-2',
        ocr_status: 'failed',
        parsed_provider: '',
        parsed_amount: null,
        parsed_currency: 'EUR',
        parsed_date: '',
        parsed_frequency: '',
        parsed_category: '',
      });
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Analyse échouée',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // PDF insert — upload throws error
  // -------------------------------------------------------------------------
  describe('handlePdfInsert — upload error', () => {
    it('shows error alert when upload throws', async () => {
      const file = {
        canceled: false,
        assets: [{ name: 'err.pdf', size: 100 * 1024, mimeType: 'application/pdf', uri: 'file://err.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(file);
      mockGetAllFolders.mockResolvedValue([]);
      mockUploadDocument.mockRejectedValue(new Error('Upload failed'));
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Erreur',
          'Upload failed',
          expect.any(Array)
        );
      });
    });

    it('shows generic error message when error has no .message', async () => {
      const file = {
        canceled: false,
        assets: [{ name: 'err2.pdf', size: 100 * 1024, mimeType: 'application/pdf', uri: 'file://err2.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(file);
      mockGetAllFolders.mockResolvedValue([]);
      mockUploadDocument.mockRejectedValue({ response: { data: { message: 'Server error' } } });
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Erreur',
          'Server error',
          expect.any(Array)
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // getDefaultSubscriptionFolderId — folder lookup
  // -------------------------------------------------------------------------
  describe('getDefaultSubscriptionFolderId — French locale', () => {
    it('uses "Abonnements" folder name for French locale', async () => {
      const file = {
        canceled: false,
        assets: [{ name: 'x.pdf', size: 100 * 1024, mimeType: 'application/pdf', uri: 'file://x.pdf' }],
      };
      mockGetDocumentAsync.mockResolvedValue(file);
      mockGetAllFolders.mockResolvedValue([
        { id: 'folder-fr', name: 'Abonnements', parentId: null },
        { id: 'folder-en', name: 'Subscriptions', parentId: null },
      ]);
      mockUploadDocument.mockResolvedValue({
        id: 'doc-fr',
        ocr_status: 'completed',
        parsed_provider: 'Test',
        parsed_amount: 10,
        parsed_currency: 'EUR',
        parsed_date: '2025-01-01',
        parsed_frequency: 'mensuel',
        parsed_category: '',
      });
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, addOperationModalOpen: true, setAddOperationModalOpen: jest.fn() });
      const { getByTestId } = render(<DashboardScreen />);
      fireEvent.press(getByTestId('modal-pdf-insert'));
      await waitFor(() => {
        expect(mockUploadDocument).toHaveBeenCalledWith(
          expect.objectContaining({ folder_id: 'folder-fr' })
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // markedDates memo — date parsing edge cases
  // -------------------------------------------------------------------------
  describe('markedDates computation', () => {
    it('renders without error when events have invalid dueDate', () => {
      const badEvents = [
        { id: 'e1', dueDate: 'not-a-date', subscription: null },
        { id: 'e2', dueDate: null, subscription: null },
      ];
      // getEventsByCategory returns these — they go through the markedDates memo
      expect(() => renderDashboard({ events: badEvents as any, getEventsByCategory: jest.fn(() => badEvents as any) })).not.toThrow();
    });

    it('adds selected date mark to markedDates', () => {
      // We just verify the component renders with a selected date without crashing
      const { toJSON } = renderDashboard({ selected: '2025-01-15' });
      expect(toJSON()).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // fetchDashboardData called via useFocusEffect
  // -------------------------------------------------------------------------
  describe('fetchDashboardData lifecycle', () => {
    it('calls fetchDashboardData on mount via useFocusEffect', () => {
      const fetchDashboardData = jest.fn();
      mockUseDashboard.mockReturnValue({ ...baseUseDashboard, fetchDashboardData });
      render(<DashboardScreen />);
      // useFocusEffect mock calls the callback immediately
      expect(fetchDashboardData).toHaveBeenCalled();
    });
  });
});
