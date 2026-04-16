import { LessThan, IsNull } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let ormRepository: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    ormRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      softDelete: jest.fn(),
    };

    repository = new UserSessionRepository(ormRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('finds a session by id excluding soft deleted rows', async () => {
    ormRepository.findOne.mockResolvedValue({ id: 'session-1' });

    await expect(repository.findById('session-1')).resolves.toEqual({ id: 'session-1' });
    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'session-1', deletedAt: IsNull() },
    });
  });

  it('finds a session by refresh token hash', async () => {
    await repository.findByRefreshTokenHash('hash-1');

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: {
        refreshTokenHash: 'hash-1',
        isRevoked: false,
        deletedAt: IsNull(),
      },
    });
  });

  it('finds active sessions ordered by last activity', async () => {
    await repository.findActiveSessions('user-1');

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isRevoked: false,
        deletedAt: IsNull(),
      },
      order: { lastActivity: 'DESC' },
    });
  });

  it('creates a session with defaults', async () => {
    const created = { id: 'session-1' };
    ormRepository.create.mockReturnValue(created);
    ormRepository.save.mockResolvedValue(created);

    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const result = await repository.create({
      userId: 'user-1',
      refreshTokenHash: 'hash-1',
      ipAddress: '127.0.0.1',
      expiresAt,
    });

    expect(ormRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: 'hash-1',
        ipAddress: '127.0.0.1',
        expiresAt,
        isRevoked: false,
        lastActivity: expect.any(Date),
      }),
    );
    expect(result).toBe(created);
  });

  it('updates last activity', async () => {
    await repository.updateLastActivity('session-1');
    expect(ormRepository.update).toHaveBeenCalledWith(
      { id: 'session-1' },
      { lastActivity: expect.any(Date) },
    );
  });

  it('revokes one session', async () => {
    await repository.revokeSession('session-1');
    expect(ormRepository.update).toHaveBeenCalledWith({ id: 'session-1' }, { isRevoked: true });
  });

  it('revokes all user sessions and keeps the provided session when exceptSessionId exists', async () => {
    await repository.revokeAllUserSessions('user-1', 'session-keep');

    expect(queryBuilder.where).toHaveBeenCalledWith('userId = :userId', { userId: 'user-1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('isRevoked = :isRevoked', {
      isRevoked: false,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('id != :exceptSessionId', {
      exceptSessionId: 'session-keep',
    });
    expect(queryBuilder.execute).toHaveBeenCalled();
  });

  it('soft deletes a session', async () => {
    await repository.softDelete('session-1');
    expect(ormRepository.softDelete).toHaveBeenCalledWith('session-1');
  });

  it('cleans up expired sessions and returns affected count', async () => {
    ormRepository.softDelete.mockResolvedValue({ affected: 3 });

    await expect(repository.cleanupExpiredSessions()).resolves.toBe(3);
    expect(ormRepository.softDelete).toHaveBeenCalledWith({
      expiresAt: LessThan(expect.any(Date)),
    });
  });

  it('cleans up revoked sessions older than the configured threshold', async () => {
    ormRepository.softDelete.mockResolvedValue({ affected: 2 });

    await expect(repository.cleanupRevokedSessions(10)).resolves.toBe(2);
    expect(ormRepository.softDelete).toHaveBeenCalledWith({
      isRevoked: true,
      lastActivity: LessThan(expect.any(Date)),
    });
  });

  it('revokes all active sessions for a user', async () => {
    await repository.revokeAllForUser('user-1');
    expect(ormRepository.update).toHaveBeenCalledWith(
      { userId: 'user-1', isRevoked: false },
      { isRevoked: true },
    );
  });

  it('finds active sessions not expired using the same active-session query', async () => {
    await repository.findActiveSessionsNotExpired('user-1');

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isRevoked: false,
        deletedAt: IsNull(),
      },
      order: { lastActivity: 'DESC' },
    });
  });

  it('returns 0 when cleanupExpiredSessions affects no rows', async () => {
    ormRepository.softDelete.mockResolvedValue({ affected: 0 });

    await expect(repository.cleanupExpiredSessions()).resolves.toBe(0);
  });

  it('returns 0 when cleanupRevokedSessions affects no rows', async () => {
    ormRepository.softDelete.mockResolvedValue({ affected: undefined });

    await expect(repository.cleanupRevokedSessions()).resolves.toBe(0);
  });

  it('revokes all user sessions without exception filter when exceptSessionId is not provided', async () => {
    await repository.revokeAllUserSessions('user-1');

    expect(queryBuilder.where).toHaveBeenCalledWith('userId = :userId', { userId: 'user-1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('isRevoked = :isRevoked', {
      isRevoked: false,
    });
    expect(queryBuilder.execute).toHaveBeenCalled();
  });
});