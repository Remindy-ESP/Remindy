import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationsScreen from '../cloud';

describe('CloudScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Espace de stockage')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Espace de stockage')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Vos documents importés')).toBeTruthy();
  });

  it('should display placeholder text when no documents', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Pas de documents pour le moment')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = render(<NotificationsScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(getByText('Espace de stockage')).toBeTruthy();
  });
});
