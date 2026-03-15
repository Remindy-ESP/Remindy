import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import NotificationsScreen from '../cloud';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: jest.fn(), 
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

const renderWithNavigation = (component: React.ReactElement) =>
  render(<NavigationContainer>{component}</NavigationContainer>);

describe('CloudScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = renderWithNavigation(<NotificationsScreen />);
    expect(getByText('Mes Documents')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = renderWithNavigation(<NotificationsScreen />);
    expect(getByText('Mes Documents')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = renderWithNavigation(<NotificationsScreen />);
    expect(getByText('Gérez votre stockage cloud')).toBeTruthy();
  });

  it('should display placeholder text when no documents', () => {
    const { getByText } = renderWithNavigation(<NotificationsScreen />);
    expect(getByText('Aucun document')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { getByText, toJSON } = renderWithNavigation(<NotificationsScreen />);
    expect(toJSON()).toBeTruthy();
    expect(getByText('Mes Documents')).toBeTruthy();
  });
});