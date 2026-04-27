import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationsScreen from '../notifications';

describe('NotificationsScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Vos notifications')).toBeTruthy();
  });

  it('should display placeholder text when no notifications', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Pas de notifications pour le moment')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = render(<NotificationsScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
  });
});
