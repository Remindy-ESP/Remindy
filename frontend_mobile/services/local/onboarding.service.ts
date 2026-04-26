import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = '@remindy_has_seen_onboarding';

class OnboardingService {
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Failed to read onboarding state:', error);
      return false;
    }
  }

  async setHasSeenOnboarding(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to persist onboarding state:', error);
      throw error;
    }
  }

  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
      throw error;
    }
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;

