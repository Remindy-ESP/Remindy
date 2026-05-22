import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import ProfilePreferencesScreen from '../profile-preferences';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

// Mock user service
const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock('@/services/api', () => ({
  userService: {
    getPreferences: (...args: any[]) => mockGetPreferences(...args),
    updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
  },
}));

const defaultPreferences = {
  userId: 'user-123',
  theme: 'dark',
  notificationEmail: true,
  notificationPush: true,
  notificationSms: false,
  defaultReminderDelay: 3,
  currency: 'EUR',
  showOnlineStatus: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ProfilePreferencesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreferences.mockResolvedValue(defaultPreferences);
    mockUpdatePreferences.mockResolvedValue(defaultPreferences);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('Chargement des préférences...')).toBeTruthy();
  });

  it('renders header after loading', async () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    await waitFor(() => {
      expect(getByText('Préférences')).toBeTruthy();
      expect(getByText('Gérer vos notifications push')).toBeTruthy();
    });
  });

  it('displays the global push toggle', async () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    await waitFor(() => {
      expect(getByTestId('global-push-toggle')).toBeTruthy();
    });
  });

  it('displays all notification category toggles', async () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    await waitFor(() => {
      expect(getByTestId('toggle-subscription_renewal')).toBeTruthy();
      expect(getByTestId('toggle-trial_ending')).toBeTruthy();
      expect(getByTestId('toggle-payment_overdue')).toBeTruthy();
      expect(getByTestId('toggle-document_processed')).toBeTruthy();
    });
  });

  it('displays category labels', async () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    await waitFor(() => {
      expect(getByText("Renouvellement d'abonnement")).toBeTruthy();
      expect(getByText("Fin de période d'essai")).toBeTruthy();
      expect(getByText('Paiement en retard')).toBeTruthy();
      expect(getByText('Document traité')).toBeTruthy();
    });
  });

  it('calls updatePreferences when toggling global push', async () => {
    mockUpdatePreferences.mockResolvedValue({
      ...defaultPreferences,
      notificationPush: false,
    });

    const { getByTestId } = render(<ProfilePreferencesScreen />);

    await waitFor(() => {
      expect(getByTestId('global-push-toggle')).toBeTruthy();
    });

    await act(async () => {
      fireEvent(getByTestId('global-push-toggle'), 'valueChange', false);
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ notificationPush: false });
  });

  it('shows error state when fetch fails', async () => {
    mockGetPreferences.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<ProfilePreferencesScreen />);
    await waitFor(() => {
      expect(getByText('Impossible de charger les préférences')).toBeTruthy();
    });
  });
});
