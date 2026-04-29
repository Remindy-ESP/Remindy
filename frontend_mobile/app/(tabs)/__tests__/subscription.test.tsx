import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SubscriptionScreen from '../subscription';
import { subscriptionService } from '../../../services/api/subscription.service';
import { categoryService } from '../../../services/api/category.service';

// Mock services
jest.mock('../../../services/api/subscription.service');
jest.mock('../../../services/api/category.service');

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock Picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

// Mock CoachMarkTarget
jest.mock('@/components/system/CoachMarkTarget', () => {
  const React = require('react');
  return ({ children }: any) => children;
});

// Mock coach-marks config
jest.mock('@/features/coach-marks/coach-marks.config', () => ({
  COACH_MARK_TARGETS: {},
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  };
});

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (subscriptionService.getAll as jest.Mock).mockResolvedValue([]);
    (categoryService.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Chargement des opérations...')).toBeTruthy();
  });

  it('shows header title', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Opérations')).toBeTruthy();
  });

  it('calls subscription service on mount', async () => {
    render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(subscriptionService.getAll).toHaveBeenCalled();
      expect(categoryService.getAll).toHaveBeenCalled();
    });
  });
});
