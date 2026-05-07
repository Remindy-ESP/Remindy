import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfilePrivacyScreen from '../profile-privacy';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
}));

const mockLogout = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

const mockExportData = jest.fn();
const mockDeleteMe = jest.fn();
jest.mock('@/services/api', () => ({
  userService: {
    exportData: (...args: any[]) => mockExportData(...args),
    deleteMe: (...args: any[]) => mockDeleteMe(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfilePrivacyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests data export', async () => {
    mockExportData.mockResolvedValue({
      id: 'export-1',
      status: 'pending',
      format: 'json',
    });

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalledWith({ format: 'json' });
    });
  });

  it('deletes account after confirmation', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    mockDeleteMe.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockDeleteMe).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows error alert when data export fails', async () => {
    mockExportData.mockRejectedValue(new Error("Erreur d'export"));

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', "Erreur d'export");
    });
  });

  it('shows error alert when export fails with response data message', async () => {
    const apiError = { response: { data: { message: 'Export non autorise' } } };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Export non autorise');
    });
  });

  it('cancels account deletion when cancel button is pressed', async () => {
    // Alert returns 'Annuler' button — simulate pressing it (index 0)
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    // Should show confirmation dialog but not call deleteMe
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Supprimer le compte',
        expect.any(String),
        expect.any(Array)
      );
    });
    expect(mockDeleteMe).not.toHaveBeenCalled();
  });

  it('shows error alert when account deletion API call fails', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (Array.isArray(buttons) && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    });

    mockDeleteMe.mockRejectedValue(new Error('Suppression echouee'));
    mockLogout.mockResolvedValue(undefined);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockDeleteMe).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Suppression echouee');
    });
  });

  it('shows error alert when deletion fails with response data message', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (Array.isArray(buttons) && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    });

    const apiError = { response: { data: { message: 'Compte introuvable' } } };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Compte introuvable');
    });
  });

  it('shows fallback error message for export when error has no response or message', async () => {
    // Error with neither response.data.message nor .message — triggers third branch
    mockExportData.mockRejectedValue({});

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        "Impossible de demander l'export des donnees."
      );
    });
  });

  it('shows fallback error message for delete when error has only message property', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (Array.isArray(buttons) && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    });

    // Error with message but no response — exercises second branch
    mockDeleteMe.mockRejectedValue({ message: 'Network error' });

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Network error');
    });
  });

  it('uses error.message for delete when response.data.message is empty', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (Array.isArray(buttons) && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    });

    // response.data.message is falsy, falls through to error.message
    const apiError = { response: { data: { message: '' } }, message: 'Fallback message' };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Fallback message');
    });
  });

  it('uses error.message for export when response.data.message is empty', async () => {
    const apiError = { response: { data: { message: '' } }, message: 'Export fallback' };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Export fallback');
    });
  });

  it('uses error.message for delete when response exists but data is null', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (Array.isArray(buttons) && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    });

    // response exists but data is null — so data?.message is undefined, falls to error.message
    const apiError = { response: { data: null }, message: 'Null data message' };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Null data message');
    });
  });

  it('uses error.message for export when response data is null', async () => {
    const apiError = { response: { data: null }, message: 'Null data export' };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Null data export');
    });
  });

  it('navigates back when back button is pressed', () => {
    const { UNSAFE_getAllByType } = render(<ProfilePrivacyScreen />);
    const { TouchableOpacity } = require('react-native');

    // The first TouchableOpacity in the tree is the icon back button (line 82)
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // touchables[0] is the back chevron button
    fireEvent.press(touchables[0]);

    expect(mockBack).toHaveBeenCalled();
  });
});

