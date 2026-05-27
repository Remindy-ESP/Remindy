import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ProfileAboutScreen from '../profile-about';

jest.spyOn(Linking, 'canOpenURL');
jest.spyOn(Linking, 'openURL');

jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  }),
  ToastProvider: ({ children }: any) => children,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockToast = require('@/context/ToastContext').toast as {
  error: jest.Mock;
  success: jest.Mock;
  info: jest.Mock;
};

const mockBack = global.__mockRouterBack as jest.Mock;

describe('ProfileAboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ProfileAboutScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the header title', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText('À propos')).toBeTruthy();
  });

  it('displays the header subtitle', () => {
    const { getByText } = render(<ProfileAboutScreen />);
    expect(getByText("Informations sur l'application")).toBeTruthy();
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
    const { UNSAFE_getAllByType } = render(<ProfileAboutScreen />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
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
      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('support@remindy.com')
      );
    });
  });

  it('shows alert when opening email throws', async () => {
    (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Link error'));
    const { getByTestId } = render(<ProfileAboutScreen />);
    fireEvent.press(getByTestId('about-support-email-button'));
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('support@remindy.com'));
    });
  });
});
