import { IUserSessionRepository } from './auth-session.entity';

describe('IUserSessionRepository', () => {
  it('can be extended by a concrete implementation', async () => {
    class TestRepository extends IUserSessionRepository {
      createSession(params: any) {
        return Promise.resolve({ id: 'session-123' });
      }
    }

    const repository = new TestRepository();

    await expect(
      repository.createSession({
        userId: 'user-1',
        refreshTokenHash: 'hash',
        ipAddress: '127.0.0.1',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }),
    ).resolves.toEqual({ id: 'session-123' });
  });
});
