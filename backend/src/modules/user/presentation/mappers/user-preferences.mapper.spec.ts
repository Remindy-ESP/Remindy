import { UserPreferencesMapper } from './user-preferences.mapper';

describe('UserPreferencesMapper', () => {
  it('maps DTO fields to application input', () => {
    const dto = {
      theme: 'dark',
      notificationEmail: true,
      notificationPush: false,
      notificationSms: true,
      defaultReminderDelay: 7,
      currency: 'EUR',
      showOnlineStatus: false,
    } as any;

    expect(UserPreferencesMapper.toInput(dto)).toEqual(dto);
  });
});
