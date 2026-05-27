import { Alert } from 'react-native';

/**
 * Simulate pressing a specific button in an Alert.alert call.
 * index 0 = first button (typically "Annuler"), index 1 = second (typically confirm).
 */
export function mockAlertPressButton(index: 0 | 1): void {
  (Alert.alert as jest.Mock).mockImplementation((_title: string, _msg: string, buttons: any[]) => {
    if (Array.isArray(buttons) && buttons[index]?.onPress) {
      buttons[index].onPress();
    }
  });
}

/** Default user fixture shared across profile screen tests. */
export const defaultProfileUser = () => ({
  id: 'test-user-id',
  email: 'utilisateur@remindy.com',
  firstName: 'Test',
  lastName: 'User',
  photoR2Key: 'users/test-user/profile-photo/avatar.jpg',
  photoUrl: 'https://cdn.example.com/avatar.jpg',
  role: 'user_freemium',
  status: 'active',
  timezone: 'Europe/Paris',
  language: 'fr',
  emailVerified: true,
  createdAt: '2026-02-22T00:00:00.000Z',
});
