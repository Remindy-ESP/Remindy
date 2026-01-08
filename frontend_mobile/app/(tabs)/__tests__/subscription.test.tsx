import React from 'react';
import { render } from '@testing-library/react-native';
import SubscriptionScreen from '../subscription';
import { subscriptionService } from '../../../services/api/subscription.service';
import { categoryService } from '../../../services/api/category.service';

// Mock services
jest.mock('../../../services/api/subscription.service');
jest.mock('../../../services/api/category.service');

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

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (subscriptionService.getAll as jest.Mock).mockResolvedValue([]);
    (categoryService.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SubscriptionScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Chargement des opérations...')).toBeTruthy();
  });

  it('shows header title', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Opérations')).toBeTruthy();
  });

  it('calls subscription service on mount', () => {
    render(<SubscriptionScreen />);
    expect(subscriptionService.getAll).toHaveBeenCalled();
    expect(categoryService.getAll).toHaveBeenCalled();
  });
});
