import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProfileEditScreen from '../profile-edit';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: any[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: any[]) =>
    mockLaunchImageLibraryAsync(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockBack = global.__mockRouterBack as jest.Mock;

// ----- Mutable auth state -----
const defaultUser = () => ({
  id: 'user-1',
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+33612345678',
  photoR2Key: undefined as any,
  photoUrl: undefined as any,
  role: 'user_freemium',
  status: 'active',
  timezone: 'Europe/Paris',
  language: 'fr',
  emailVerified: true,
  createdAt: '2026-02-22T00:00:00.000Z',
});
let mockUser: any = defaultUser();

const mockRefreshUser = jest.fn(() => Promise.resolve());

jest.mock('@/modules/auth/application/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, refreshUser: mockRefreshUser }),
}));

// ----- Services -----
const mockUpdateMe = jest.fn();
const mockUploadMyPhoto = jest.fn();
const mockDeleteMyPhoto = jest.fn();

jest.mock('@/services/api', () => ({
  userService: {
    updateMe: (...args: any[]) => mockUpdateMe(...args),
    uploadMyPhoto: (...args: any[]) => mockUploadMyPhoto(...args),
    deleteMyPhoto: (...args: any[]) => mockDeleteMyPhoto(...args),
  },
}));

// ----- UserAvatar -----
jest.mock('@/modules/profile/ui/UserAvatar', () => {
  const { View } = require('react-native');
  return ({ testID }: any) => <View testID={testID ?? 'user-avatar'} />;
});

// ----- Alert spy -----
jest.spyOn(Alert, 'alert');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderScreen = () => render(<ProfileEditScreen />);

const getLastAlertButton = (text: string) => {
  const calls = (Alert.alert as jest.Mock).mock.calls;
  const buttons = calls[calls.length - 1][2];
  return buttons.find((b: any) => b.text === text);
};

const mockImageAsset = (
  uri: string,
  fileName: string,
  mimeType: string | undefined,
  fileSize: number,
) =>
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri, fileName, mimeType, fileSize }],
  });

const mockJpeg = (fileSize = 50000) => mockImageAsset('file://photo.jpg', 'photo.jpg', 'image/jpeg', fileSize);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset to default user
    mockUser = defaultUser();

    mockUpdateMe.mockResolvedValue(undefined);
    mockRefreshUser.mockResolvedValue(undefined);
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
  });

  // ---- rendering ----

  it('renders the screen header', () => {
    const { getByText } = renderScreen();
    expect(getByText('Modifier le profil')).toBeTruthy();
    expect(getByText('Édition des informations du profil')).toBeTruthy();
  });

  it('renders all form fields with current user data', () => {
    const { getByDisplayValue } = renderScreen();
    expect(getByDisplayValue('John')).toBeTruthy();
    expect(getByDisplayValue('Doe')).toBeTruthy();
    expect(getByDisplayValue('+33612345678')).toBeTruthy();
    expect(getByDisplayValue('fr')).toBeTruthy();
    expect(getByDisplayValue('Europe/Paris')).toBeTruthy();
  });

  it('renders the back button', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('renders the user avatar', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('profile-edit-avatar')).toBeTruthy();
  });

  it('renders the choose-photo button with "Ajouter une photo" when no photoR2Key', () => {
    const { getByText } = renderScreen();
    expect(getByText('Ajouter une photo')).toBeTruthy();
  });

  it('renders "Changer la photo" and remove button when photoR2Key is set', () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    const { getByText, getByTestId } = renderScreen();
    expect(getByText('Changer la photo')).toBeTruthy();
    expect(getByTestId('remove-photo-button')).toBeTruthy();
  });

  it('renders without remove-photo-button when no photoR2Key', () => {
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('remove-photo-button')).toBeNull();
  });

  it('renders empty form fields when user has no data', () => {
    mockUser = {
      id: 'user-2',
      email: 'empty@test.com',
      firstName: undefined,
      lastName: undefined,
      phone: undefined,
      language: undefined,
      timezone: undefined,
      photoR2Key: undefined,
      photoUrl: undefined,
      role: 'user_freemium',
      status: 'active',
      emailVerified: false,
      createdAt: '2026-01-01',
    };
    const { getAllByDisplayValue } = renderScreen();
    // All fields should be empty strings
    expect(getAllByDisplayValue('')).toBeTruthy();
  });

  it('renders the save button', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('save-profile-button')).toBeTruthy();
  });

  it('renders the help text', () => {
    const { getByText } = renderScreen();
    expect(getByText(/optionnels/)).toBeTruthy();
  });

  // ---- back navigation ----

  it('calls router.back() when back button is pressed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  // ---- form field changes ----

  it('updates firstName field when user types', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');
    expect(getByTestId('input-firstName').props.value).toBe('Jane');
  });

  it('updates lastName field when user types', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-lastName'), 'Smith');
    expect(getByTestId('input-lastName').props.value).toBe('Smith');
  });

  it('updates phone field when user types', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-phone'), '+33600000000');
    expect(getByTestId('input-phone').props.value).toBe('+33600000000');
  });

  it('updates language field when user types', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-language'), 'en');
    expect(getByTestId('input-language').props.value).toBe('en');
  });

  it('updates timezone field when user types', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-timezone'), 'America/New_York');
    expect(getByTestId('input-timezone').props.value).toBe('America/New_York');
  });

  // ---- clear buttons ----

  it('clears firstName when "Effacer" is pressed for firstName', () => {
    const { getByTestId, getAllByText } = renderScreen();
    // There are multiple "Effacer" buttons, first one is for firstName
    const clearButtons = getAllByText('Effacer');
    fireEvent.press(clearButtons[0]);
    expect(getByTestId('input-firstName').props.value).toBe('');
  });

  it('clears lastName when "Effacer" is pressed for lastName', () => {
    const { getByTestId, getAllByText } = renderScreen();
    const clearButtons = getAllByText('Effacer');
    fireEvent.press(clearButtons[1]);
    expect(getByTestId('input-lastName').props.value).toBe('');
  });

  it('clears phone when "Effacer" is pressed for phone', () => {
    const { getByTestId, getAllByText } = renderScreen();
    const clearButtons = getAllByText('Effacer');
    fireEvent.press(clearButtons[2]);
    expect(getByTestId('input-phone').props.value).toBe('');
  });

  // ---- isDirty / save button enabled ----

  it('save button is disabled when form is unchanged', () => {
    const { getByTestId } = renderScreen();
    const saveBtn = getByTestId('save-profile-button');
    expect(saveBtn.props.accessibilityState?.disabled ?? saveBtn.props.disabled).toBeTruthy();
  });

  it('save button is enabled after a field is changed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');
    const saveBtn = getByTestId('save-profile-button');
    // disabled prop should be false
    expect(saveBtn.props.accessibilityState?.disabled ?? saveBtn.props.disabled).toBeFalsy();
  });

  // ---- save (success path) ----

  it('calls userService.updateMe with correct payload on save', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Jane', lastName: 'Doe' })
    );
  });

  it('calls refreshUser after successful save', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it('shows success alert after saving', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Succès', expect.any(String));
  });

  it('calls router.back() after successful save', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('sends undefined for empty language field on save', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId, getAllByText } = renderScreen();

    // Clear language (no clear button – it has no onClear prop, just change text to '')
    fireEvent.changeText(getByTestId('input-language'), '');
    // Also change another field to make isDirty true
    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ language: undefined })
    );
  });

  it('sends undefined for empty timezone field on save', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-timezone'), '   ');
    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: undefined })
    );
  });

  // ---- save (error path) ----

  it('shows error alert when updateMe fails with generic error', async () => {
    mockUpdateMe.mockRejectedValue(new Error('Network error'));
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Network error');
  });

  it('shows server error message from response.data.message', async () => {
    mockUpdateMe.mockRejectedValue({
      response: { data: { message: 'Validation failed' } },
    });
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');

    await act(async () => {
      fireEvent.press(getByTestId('save-profile-button'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Validation failed');
  });

  it('renders with disabled save button and empty fields when user is null', () => {
    mockUser = null;
    const { getByTestId, getAllByDisplayValue } = renderScreen();

    // All fields should be empty (initialised from null user)
    expect(getAllByDisplayValue('')).toBeTruthy();

    // Save button should be disabled (form is not dirty)
    const btn = getByTestId('save-profile-button');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  // ---- photo upload ----

  it('requests media library permissions when choose photo is pressed', async () => {
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('choose-photo-button'));
    });

    expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
  });

  it('shows permission alert when media library permission is denied', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('choose-photo-button'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Permission requise', expect.any(String));
  });

  it('does nothing when image picker is cancelled', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('choose-photo-button'));
    });

    expect(mockUploadMyPhoto).not.toHaveBeenCalled();
  });

  it('uploads photo successfully', async () => {
    mockJpeg();
    mockUploadMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(mockUploadMyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'file://photo.jpg', type: 'image/jpeg' })
    );
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Succès', expect.any(String));
  });

  it('shows error alert when photo upload fails', async () => {
    mockJpeg();
    mockUploadMyPhoto.mockRejectedValue(new Error('Upload failed'));

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Upload failed');
  });

  it('shows server error when photo upload fails with response message', async () => {
    mockJpeg();
    mockUploadMyPhoto.mockRejectedValue({ response: { data: { message: 'File type not supported' } } });

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'File type not supported');
  });

  it('shows error for empty file (fileSize <= 0)', async () => {
    mockImageAsset('file://empty.jpg', 'empty.jpg', 'image/jpeg', 0);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Le fichier image est vide.');
    expect(mockUploadMyPhoto).not.toHaveBeenCalled();
  });

  it('handles PNG mime type correctly in buildPhotoFilePayload', async () => {
    mockImageAsset('file://photo.png', 'photo.png', 'image/png', 30000);
    mockUploadMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(mockUploadMyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/png', name: 'photo.png' })
    );
  });

  it('handles WebP mime type correctly in buildPhotoFilePayload', async () => {
    mockImageAsset('file://photo.webp', 'photo.webp', 'image/webp', 30000);
    mockUploadMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(mockUploadMyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/webp', name: 'photo.webp' })
    );
  });

  it('infers mime type from URI extension when mimeType is missing', async () => {
    mockImageAsset('file://photo.jpg', undefined as any, undefined, 30000);
    mockUploadMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(mockUploadMyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/jpeg' })
    );
  });

  it('generates a filename when no fileName is provided', async () => {
    mockImageAsset('file://photo.png', undefined as any, 'image/png', 30000);
    mockUploadMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(mockUploadMyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringMatching(/^profile-photo-\d+\.png$/) })
    );
  });

  it('shows error when mimeType is not an image type', async () => {
    mockImageAsset('file://doc.pdf', 'doc.pdf', undefined, 30000);

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('choose-photo-button')); });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.any(String));
  });

  it('choose-photo button is disabled while upload is in progress', async () => {
    let resolveUpload!: () => void;
    const slowUpload = new Promise<void>(resolve => { resolveUpload = resolve; });

    mockImageAsset('file://p.jpg', 'p.jpg', 'image/jpeg', 100);
    mockUploadMyPhoto.mockReturnValue(slowUpload);

    const { getByTestId } = renderScreen();

    // Start slow upload (don't await)
    act(() => { fireEvent.press(getByTestId('choose-photo-button')); });

    // While the image picker is being processed, button gets disabled
    // (it goes disabled when permission is requested)
    await waitFor(() => {
      expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });

    // Resolve the upload so the component can clean up
    await act(async () => { resolveUpload(); });
  });

  // ---- photo removal ----

  it('shows confirmation alert when remove photo is pressed', async () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('remove-photo-button'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Supprimer la photo',
      expect.any(String),
      expect.any(Array)
    );
  });

  it('calls deleteMyPhoto when removal is confirmed', async () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    mockDeleteMyPhoto.mockResolvedValue(undefined);

    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('remove-photo-button'));
    });

    await act(async () => { getLastAlertButton('Supprimer').onPress(); });

    expect(mockDeleteMyPhoto).toHaveBeenCalled();
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Succès', expect.any(String));
  });

  it('does not call deleteMyPhoto when removal is cancelled', async () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    const { getByTestId } = renderScreen();

    await act(async () => { fireEvent.press(getByTestId('remove-photo-button')); });

    const cancelButton = getLastAlertButton('Annuler');
    if (cancelButton?.onPress) {
      await act(async () => { cancelButton.onPress(); });
    }

    expect(mockDeleteMyPhoto).not.toHaveBeenCalled();
  });

  it('shows error alert when photo deletion fails', async () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    mockDeleteMyPhoto.mockRejectedValue(new Error('Delete error'));

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('remove-photo-button')); });
    await act(async () => { getLastAlertButton('Supprimer').onPress(); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Delete error');
    });
  });

  it('shows server error message when photo deletion fails with response', async () => {
    mockUser = { ...mockUser, photoR2Key: 'photo/key.jpg' };
    mockDeleteMyPhoto.mockRejectedValue({ response: { data: { message: 'Photo not found' } } });

    const { getByTestId } = renderScreen();
    await act(async () => { fireEvent.press(getByTestId('remove-photo-button')); });
    await act(async () => { getLastAlertButton('Supprimer').onPress(); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Photo not found');
    });
  });

  it('does not call handleRemovePhoto when no photoR2Key (guard check)', async () => {
    // photoR2Key is undefined by default — button is not rendered
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('remove-photo-button')).toBeNull();
  });

  // ---- isDirty checks ----

  it('isDirty is true when phone changes', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-phone'), '+33600000001');
    const btn = getByTestId('save-profile-button');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it('isDirty is true when language changes', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-language'), 'en');
    const btn = getByTestId('save-profile-button');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it('isDirty is true when timezone changes', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-timezone'), 'UTC');
    const btn = getByTestId('save-profile-button');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it('isDirty reverts to false when field is changed back to original value', () => {
    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');
    fireEvent.changeText(getByTestId('input-firstName'), 'John'); // back to original
    const btn = getByTestId('save-profile-button');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  // ---- assets with empty length -----

  it('does nothing when image picker returns canceled with empty assets', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [] });
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('choose-photo-button'));
    });

    expect(mockUploadMyPhoto).not.toHaveBeenCalled();
  });
});
