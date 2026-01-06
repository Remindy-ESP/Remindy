import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationsScreen from '../promotion';

describe('PromotionScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Promotions')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Promotions')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Voici nos offres partenaires')).toBeTruthy();
  });

  it('should display placeholder text when no promotions', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Pas de promotions pour le moment')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = render(<NotificationsScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(getByText('Promotions')).toBeTruthy();
  });
});
