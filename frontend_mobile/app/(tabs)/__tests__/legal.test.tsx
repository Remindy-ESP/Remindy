import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationsScreen from '../legal';

describe('LegalScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Charte juridique')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Charte juridique')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Gestion des données dans l\'application')).toBeTruthy();
  });

  it('should display placeholder text', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText(/Pas de contenu juridique pour le moment/)).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = render(<NotificationsScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(getByText('Charte juridique')).toBeTruthy();
  });
});
