import React from 'react';
import { Clipboard, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PromotionScreen from '../promotion';

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

describe('PromotionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
    jest.spyOn(Clipboard, 'setString').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders promo list content', () => {
    const { getByText } = render(<PromotionScreen />);

    expect(getByText('Promos')).toBeTruthy();
    expect(getByText('Amazon')).toBeTruthy();
    expect(getByText('Spotify')).toBeTruthy();
    expect(getByText('EDF')).toBeTruthy();
    expect(getByText('Fitness Park')).toBeTruthy();
    expect(getByText('-30%')).toBeTruthy();
    expect(getByText('-20%')).toBeTruthy();
    expect(getByText('-35%')).toBeTruthy();
    expect(getByText('-15%')).toBeTruthy();
  });

  it('copies promo code when pressing copy button', () => {
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('copy-code-amazon'));

    expect(Clipboard.setString).toHaveBeenCalledWith('AMZREMI30');
    expect(mockToast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('opens partner website when pressing website button', async () => {
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-spotify'));

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.spotify.com/fr/premium/');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.spotify.com/fr/premium/');
    });
  });

  it('shows alert if partner website cannot be opened', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false);
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-edf'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // ── Missing coverage ────────────────────────────────────────────────────────

  it('shows error alert when Linking.openURL throws (catch block, line 83)', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('cannot open'));
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-amazon'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('shows error alert when Linking.canOpenURL throws (catch block)', async () => {
    (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('linking error'));
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-spotify'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('renders separators between promo rows (not after the last row)', () => {
    const { getByTestId } = render(<PromotionScreen />);
    // All four rows render
    expect(getByTestId('promo-row-amazon')).toBeTruthy();
    expect(getByTestId('promo-row-spotify')).toBeTruthy();
    expect(getByTestId('promo-row-edf')).toBeTruthy();
    expect(getByTestId('promo-row-fitness-park')).toBeTruthy();
  });

  it('opens partner website when pressing the promo row itself', async () => {
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('promo-row-amazon'));

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.amazon.fr/prime');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.amazon.fr/prime');
    });
  });

  it('copies promo code for all promo items', () => {
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('copy-code-spotify'));
    expect(Clipboard.setString).toHaveBeenCalledWith('SPOTI20REM');
    expect(mockToast.success).toHaveBeenCalledWith(expect.any(String));

    fireEvent.press(getByTestId('copy-code-edf'));
    expect(Clipboard.setString).toHaveBeenCalledWith('EDFREMINDY35');
    expect(mockToast.success).toHaveBeenCalledWith(expect.any(String));

    fireEvent.press(getByTestId('copy-code-fitness-park'));
    expect(Clipboard.setString).toHaveBeenCalledWith('FITPARK15');
    expect(mockToast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('renders promo codes as text', () => {
    const { getByText } = render(<PromotionScreen />);
    expect(getByText('AMZREMI30')).toBeTruthy();
    expect(getByText('SPOTI20REM')).toBeTruthy();
    expect(getByText('EDFREMINDY35')).toBeTruthy();
    expect(getByText('FITPARK15')).toBeTruthy();
  });

  it('renders subtitle text', () => {
    const { getByText } = render(<PromotionScreen />);
    expect(getByText('Offres partenaires et codes promo disponibles')).toBeTruthy();
  });
});
