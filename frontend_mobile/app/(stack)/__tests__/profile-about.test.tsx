import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import ProfileAboutScreen from '../profile-about';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'canOpenURL');
jest.spyOn(Linking, 'openURL');

describe('ProfileAboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ProfileAboutScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the header title', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('A propos')).toBeTruthy();
  });

  it('displays the header subtitle', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('Informations sur l application')).toBeTruthy();
  });

  it('displays the app name', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('Remindy')).toBeTruthy();
  });

  it('displays the app version', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('1.0.0')).toBeTruthy();
  });

  it('displays the support email', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('support@remindy.com')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    // The back button is an icon button - find it via the chevron area
    const { getAllByRole } = render(<ProfileAboutScreen />);
    // Just trigger mockBack via the back button touchable
    const { UNSAFE_getAllByType } = render(<ProfileAboutScreen />);
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // First touchable is the back button
    fireEvent.press(touchables[0]);
    expect(mockBack).toHaveBeenCalled();
  });

  it('opens email when contact is pressed and email is available', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId } = render(<ProfileAboutScreen />);
    fireEvent.press(getByTestId('about-support-email-button'));
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('mailto:support@remindy.com');
      expect(Linking.openURL).toHaveBeenCalledWith('mailto:support@remindy.com');
    });
  });

  it('shows alert when email cannot be opened', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const { getByTestId } = render(<ProfileAboutScreen />);
    fireEvent.press(getByTestId('about-support-email-button'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email indisponible',
        expect.stringContaining('support@remindy.com')
      );
    });
  });

  it('shows alert when opening email throws', async () => {
    (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Link error'));
    const { getByTestId } = render(<ProfileAboutScreen />);
    fireEvent.press(getByTestId('about-support-email-button'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.stringContaining('support@remindy.com'));
    });
  });
});
