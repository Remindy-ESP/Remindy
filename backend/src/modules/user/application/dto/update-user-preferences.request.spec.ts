import { UpdateUserPreferencesRequest } from './update-user-preferences.request';

describe('UpdateUserPreferencesRequest', () => {
  it('stores provided preference fields', () => {
    const request = new UpdateUserPreferencesRequest();
    request.theme = 'dark' as any;
    request.notificationEmail = true;
    request.notificationPush = false;
    request.notificationSms = true;
    request.defaultReminderDelay = 14;
    request.currency = 'EUR';
    request.showOnlineStatus = false;

    expect(request).toEqual({
      theme: 'dark',
      notificationEmail: true,
      notificationPush: false,
      notificationSms: true,
      defaultReminderDelay: 14,
      currency: 'EUR',
      showOnlineStatus: false,
    });
  });
});
