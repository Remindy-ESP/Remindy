import AsyncStorage from '@react-native-async-storage/async-storage';

// jest.setup.js mocks this module globally; unmock here to test the real implementation.
jest.unmock('@/services/local/onboarding.service');
import onboardingService from '../onboarding.service';

const ONBOARDING_KEY = '@remindy_has_seen_onboarding';

describe('OnboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasSeenOnboarding', () => {
    it('returns true when AsyncStorage has "true"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      const result = await onboardingService.hasSeenOnboarding();
      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(ONBOARDING_KEY);
    });

    it('returns false when AsyncStorage has "false"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
      const result = await onboardingService.hasSeenOnboarding();
      expect(result).toBe(false);
    });

    it('returns false when AsyncStorage has null (not set)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await onboardingService.hasSeenOnboarding();
      expect(result).toBe(false);
    });

    it('returns false and logs error when AsyncStorage throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const result = await onboardingService.hasSeenOnboarding();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('setHasSeenOnboarding', () => {
    it('sets "true" in AsyncStorage when value is true', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      await onboardingService.setHasSeenOnboarding(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'true');
    });

    it('sets "false" in AsyncStorage when value is false', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      await onboardingService.setHasSeenOnboarding(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'false');
    });

    it('throws and logs error when AsyncStorage.setItem throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const storageError = new Error('Storage write error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(storageError);
      await expect(onboardingService.setHasSeenOnboarding(true)).rejects.toThrow('Storage write error');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('resetOnboarding', () => {
    it('removes the onboarding key from AsyncStorage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      await onboardingService.resetOnboarding();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(ONBOARDING_KEY);
    });

    it('throws and logs error when AsyncStorage.removeItem throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const storageError = new Error('Storage remove error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(storageError);
      await expect(onboardingService.resetOnboarding()).rejects.toThrow('Storage remove error');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
