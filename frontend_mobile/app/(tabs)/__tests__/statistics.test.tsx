import React from 'react';
import { render } from '@testing-library/react-native';
import StatsScreen from '../statistics';

describe('StatisticsScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<StatsScreen />);
    expect(getByText('Statistiques')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<StatsScreen />);
    expect(getByText('Statistiques')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<StatsScreen />);
    expect(getByText('Consultez vos statistiques')).toBeTruthy();
  });

  it('should display placeholder text when no statistics', () => {
    const { getByText } = render(<StatsScreen />);
    expect(getByText('Pas de statistiques pour le moment')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = render(<StatsScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(getByText('Statistiques')).toBeTruthy();
  });
});
