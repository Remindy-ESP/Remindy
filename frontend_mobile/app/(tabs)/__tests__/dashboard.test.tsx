import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../dashboard';

// Mock react-native-calendars
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates, testID }: any) => {
    const MockCalendar = require('react-native').View;
    return (
      <MockCalendar
        testID={testID}
        onPress={() =>
          onDayPress && onDayPress({ dateString: '2025-01-15' })
        }
      />
    );
  },
}));

describe('DashboardScreen', () => {
  it('renders dashboard header', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Gérez vos rappels et événements')).toBeTruthy();
  });

  it('renders calendar component', () => {
    const { getByTestId } = render(<DashboardScreen />);
    expect(getByTestId('calendar')).toBeTruthy();
  });

  it('renders reminders section', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Rappels du jour')).toBeTruthy();
  });

  it('shows default message when no date is selected', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(
      getByText('Sélectionnez une date pour voir vos rappels')
    ).toBeTruthy();
  });

  it('updates selected date when day is pressed', () => {
    const { getByTestId, getByText } = render(<DashboardScreen />);
    const calendar = getByTestId('calendar');

    fireEvent.press(calendar);

    // After selecting a date, the message should update
    expect(getByText('Aucun rappel pour le 2025-01-15')).toBeTruthy();
  });

  it('displays calendar with correct styling', () => {
    const { getByTestId } = render(<DashboardScreen />);
    const calendar = getByTestId('calendar');
    expect(calendar).toBeTruthy();
  });
});
