import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../notifications';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    token: 'token',
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('expo-router', () => {
  const mockReact = require('react');
  return {
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
    useFocusEffect: (cb: () => void) => {
      mockReact.useEffect(() => { cb(); }, []);
    },
  };
});

jest.mock('../../../services/api', () => ({
  notificationService: {
    getNotifications: jest.fn(() => Promise.resolve([])),
    markAsRead: jest.fn(() => Promise.resolve({})),
    markAllAsRead: jest.fn(() => Promise.resolve({ count: 0 })),
    deleteNotification: jest.fn(() => Promise.resolve({})),
    deleteAllNotifications: jest.fn(() => Promise.resolve({})),
  },
  Notification: {},
  NotificationType: {},
}));

jest.mock('../../../services/api/category.service', () => ({
  categoryService: { getAll: jest.fn(() => Promise.resolve([])) },
}));

jest.mock('../../../services/api/subscription.service', () => ({
  subscriptionService: { getAll: jest.fn(() => Promise.resolve([])) },
}));

describe('NotificationsScreen', () => {
  it('should render without crashing', async () => {
    const { findByText } = render(<NotificationsScreen />);
    expect(await findByText('Notifications')).toBeTruthy();
  });

  it('should display the header title', async () => {
    const { findByText } = render(<NotificationsScreen />);
    expect(await findByText('Notifications')).toBeTruthy();
  });

  it('should display the header subtitle', async () => {
    const { findByText } = render(<NotificationsScreen />);
    expect(await findByText('Vos alertes et rappels')).toBeTruthy();
  });

  it('should display placeholder text when no notifications', async () => {
    const { findByText } = render(<NotificationsScreen />);
    expect(await findByText('Pas de notifications pour le moment')).toBeTruthy();
  });

  it('should render with correct structure', async () => {
    const { findByText, toJSON } = render(<NotificationsScreen />);
    await findByText('Notifications');
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });
});
