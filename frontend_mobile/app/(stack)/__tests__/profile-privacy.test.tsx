import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfilePrivacyScreen from '../profile-privacy';

const mockReplace = global.__mockRouterReplace as jest.Mock;
const mockBack = global.__mockRouterBack as jest.Mock;

const mockLogout = jest.fn();
jest.mock('@/modules/auth/application/AuthContext', () => ({
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

let _mockConfirmResult = true;
const mockShowConfirm = jest.fn().mockImplementation(() => Promise.resolve(_mockConfirmResult));
jest.mock('@/context/ConfirmContext', () => ({
  showConfirm: (...args: any[]) => mockShowConfirm(...args),
  ConfirmProvider: ({ children }: any) => children,
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastInfo = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(
    jest.fn(),
    { error: (...args: any[]) => mockToastError(...args), success: (...args: any[]) => mockToastSuccess(...args), info: (...args: any[]) => mockToastInfo(...args) }
  ),
  ToastProvider: ({ children }: any) => children,
}));

describe('ProfilePrivacyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _mockConfirmResult = true;
    mockShowConfirm.mockImplementation(() => Promise.resolve(_mockConfirmResult));
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
    mockShowConfirm.mockResolvedValueOnce(true);
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

  it('shows error toast when data export fails', async () => {
    mockExportData.mockRejectedValue(new Error("Erreur d'export"));

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Erreur d'export");
    });
  });

  it('shows error toast when export fails with response data message', async () => {
    const apiError = { response: { data: { message: 'Export non autorise' } } };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Export non autorise');
    });
  });

  it('cancels account deletion when cancel button is pressed', async () => {
    mockShowConfirm.mockResolvedValueOnce(false);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: expect.any(String) }));
    });
    expect(mockDeleteMe).not.toHaveBeenCalled();
  });

  it('shows error toast when account deletion API call fails', async () => {
    mockShowConfirm.mockResolvedValueOnce(true);

    mockDeleteMe.mockRejectedValue(new Error('Suppression echouee'));
    mockLogout.mockResolvedValue(undefined);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockDeleteMe).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Suppression echouee');
    });
  });

  it('shows error toast when deletion fails with response data message', async () => {
    mockShowConfirm.mockResolvedValueOnce(true);

    const apiError = { response: { data: { message: 'Compte introuvable' } } };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Compte introuvable');
    });
  });

  it('shows fallback error toast for export when error has no response or message', async () => {
    // Error with neither response.data.message nor .message — triggers third branch
    mockExportData.mockRejectedValue({});

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Impossible de demander l'export des données."
      );
    });
  });

  it('shows fallback error toast for delete when error has only message property', async () => {
    mockShowConfirm.mockResolvedValueOnce(true);

    // Error with message but no response — exercises second branch
    mockDeleteMe.mockRejectedValue({ message: 'Network error' });

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Network error');
    });
  });

  it('uses error.message for delete when response.data.message is empty', async () => {
    mockShowConfirm.mockResolvedValueOnce(true);

    // response.data.message is falsy, falls through to error.message
    const apiError = { response: { data: { message: '' } }, message: 'Fallback message' };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Fallback message');
    });
  });

  it('uses error.message for export when response.data.message is empty', async () => {
    const apiError = { response: { data: { message: '' } }, message: 'Export fallback' };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Export fallback');
    });
  });

  it('uses error.message for delete when response exists but data is null', async () => {
    mockShowConfirm.mockResolvedValueOnce(true);

    // response exists but data is null — so data?.message is undefined, falls to error.message
    const apiError = { response: { data: null }, message: 'Null data message' };
    mockDeleteMe.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Null data message');
    });
  });

  it('uses error.message for export when response data is null', async () => {
    const apiError = { response: { data: null }, message: 'Null data export' };
    mockExportData.mockRejectedValue(apiError);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Null data export');
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
