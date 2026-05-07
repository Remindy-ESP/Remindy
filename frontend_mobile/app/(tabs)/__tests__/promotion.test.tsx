import React from 'react';
import { Clipboard, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import PromotionScreen from '../promotion';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe('PromotionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Code promo copié',
      text2: 'Amazon : AMZREMI30',
    });
  });

  it('opens partner website when pressing website button', async () => {
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-spotify'));

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.spotify.com/fr/premium/');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.spotify.com/fr/premium/');
    });
  });

  it('shows toast if partner website cannot be opened', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false);
    const { getByTestId } = render(<PromotionScreen />);

    fireEvent.press(getByTestId('open-link-edf'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Lien indisponible',
        text2: "Impossible d'ouvrir https://particulier.edf.fr/",
      });
    });
  });
});
