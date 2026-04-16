import { UserPresenter } from './user.presenter';

describe('UserPresenter', () => {
  it('maps nullable fields to undefined for the mobile response', () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    const result = UserPresenter.toMe({
      id: 'user-1',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      phone: null,
      photoR2Key: null,
      role_key: 'USER_FREEMIUM',
      status: 'active',
      timezone: 'Europe/Paris',
      language: 'fr',
      emailVerified: true,
      createdAt,
    } as any);

    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      firstName: undefined,
      lastName: undefined,
      phone: undefined,
      photoR2Key: undefined,
      role: 'USER_FREEMIUM',
      status: 'active',
      timezone: 'Europe/Paris',
      language: 'fr',
      emailVerified: true,
      createdAt,
    });
  });
});
