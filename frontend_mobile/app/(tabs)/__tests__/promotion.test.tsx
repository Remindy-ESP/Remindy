import React from 'react';
import { Alert, Clipboard, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PromotionScreen from '../promotion';

describe('PromotionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
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
    expect(Alert.alert).toHaveBeenCalledWith('Code promo copie', 'Amazon : AMZREMI30');
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
      expect(Alert.alert).toHaveBeenCalledWith(
        'Lien indisponible',
        "Impossible d'ouvrir https://particulier.edf.fr/",
      );
    });
  });
});
