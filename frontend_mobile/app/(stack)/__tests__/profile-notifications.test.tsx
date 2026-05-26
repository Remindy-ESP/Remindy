import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileNotificationsScreen from '../profile-notifications';

const mockBack = global.__mockRouterBack as jest.Mock;

const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock('@/services/api', () => ({
  userService: {
    getPreferences: (...args: any[]) => mockGetPreferences(...args),
    updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
  },
}));

// Mock useFocusEffect from @react-navigation/native to run the effect instantly in tests
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    require('react').useEffect(() => {
      callback();
    }, []);
  }),
}));

const mockPreferences = {
  userId: 'user-123',
  theme: 'dark' as const,
  notificationPush: true,
  notificationEmail: false,
  notificationSms: false,
  defaultReminderDelay: 1,
  currency: 'EUR',
  showOnlineStatus: true,
  createdAt: '2026-05-26T00:00:00Z',
  updatedAt: '2026-05-26T00:00:00Z',
};

describe('ProfileNotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreferences.mockResolvedValue(mockPreferences);
    mockUpdatePreferences.mockResolvedValue(mockPreferences);
  });

  it('renders loading state initially', () => {
    mockGetPreferences.mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<ProfileNotificationsScreen />);
    expect(getByText('profile.notificationSettings.loading')).toBeTruthy();
  });

  it('renders notification channels after loading preferences', async () => {
    const { getByText } = render(<ProfileNotificationsScreen />);

    await waitFor(() => {
      expect(getByText('profile.notificationSettings.title')).toBeTruthy();
      expect(getByText('profile.notificationSettings.subtitle')).toBeTruthy();
      expect(getByText('profile.notificationSettings.push.label')).toBeTruthy();
      expect(getByText('profile.notificationSettings.email.label')).toBeTruthy();
    });
  });

  it('shows error state when fetching preferences fails', async () => {
    mockGetPreferences.mockRejectedValue(new Error('Network error'));
    const { getByText } = render(<ProfileNotificationsScreen />);

    await waitFor(() => {
      expect(getByText('profile.notificationSettings.loadError')).toBeTruthy();
    });
  });

  it('toggles push notifications switch', async () => {
    const { getByTestId } = render(<ProfileNotificationsScreen />);

    await waitFor(() => expect(getByTestId('toggle-notificationPush')).toBeTruthy());

    const pushSwitch = getByTestId('toggle-notificationPush');
    mockUpdatePreferences.mockResolvedValue({
      ...mockPreferences,
      notificationPush: false,
    });

    fireEvent(pushSwitch, 'valueChange', false);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ notificationPush: false });
    });
  });

  it('toggles email notifications switch', async () => {
    const { getByTestId } = render(<ProfileNotificationsScreen />);

    await waitFor(() => expect(getByTestId('toggle-notificationEmail')).toBeTruthy());

    const emailSwitch = getByTestId('toggle-notificationEmail');
    mockUpdatePreferences.mockResolvedValue({
      ...mockPreferences,
      notificationEmail: true,
    });

    fireEvent(emailSwitch, 'valueChange', true);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ notificationEmail: true });
    });
  });

  it('rolls back toggle state on API failure', async () => {
    const { getByTestId } = render(<ProfileNotificationsScreen />);

    await waitFor(() => expect(getByTestId('toggle-notificationPush')).toBeTruthy());

    const pushSwitch = getByTestId('toggle-notificationPush');
    mockUpdatePreferences.mockRejectedValue(new Error('API failed'));

    fireEvent(pushSwitch, 'valueChange', false);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ notificationPush: false });
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByText } = render(<ProfileNotificationsScreen />);

    await waitFor(() => {
      expect(getByText('chevron-back')).toBeTruthy();
    });

    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
