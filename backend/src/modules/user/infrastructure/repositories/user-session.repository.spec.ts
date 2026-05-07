import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';
import { UserSessionEntity } from '../../../../infrastructure/database/entities/user-session.entity';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let typeOrmRepository: jest.Mocked<
    Repository<UserSessionEntity> & {
      createQueryBuilder: jest.Mock;
    }
  >;

  const mockQueryBuilder: any = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockSession: Partial<UserSessionEntity> = {
    id: 'session-123',
    userId: 'user-123',
    refreshTokenHash: 'hash-abc',
    isRevoked: false,
    lastActivity: new Date('2025-01-01'),
    expiresAt: new Date('2025-12-31'),
    deviceName: 'Chrome on Windows',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionRepository,
        {
          provide: getRepositoryToken(UserSessionEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserSessionRepository>(UserSessionRepository);
    typeOrmRepository = module.get(getRepositoryToken(UserSessionEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a session by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockSession as UserSessionEntity);

      const result = await repository.findById('session-123');

      expect(result).toBe(mockSession);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-123', deletedAt: IsNull() },
      });
    });

    it('should return null when session not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByRefreshTokenHash', () => {
    it('should find a session by refresh token hash', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockSession as UserSessionEntity);

      const result = await repository.findByRefreshTokenHash('hash-abc');

      expect(result).toBe(mockSession);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: 'hash-abc',
          isRevoked: false,
          deletedAt: IsNull(),
        },
      });
    });

    it('should return null when no matching session found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByRefreshTokenHash('invalid-hash');

      expect(result).toBeNull();
    });
  });

  describe('findActiveSessions', () => {
    it('should find active sessions for a user', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
      typeOrmRepository.find.mockResolvedValue(sessions as UserSessionEntity[]);

      const result = await repository.findActiveSessions('user-123');

      expect(result).toBe(sessions);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRevoked: false,
          deletedAt: IsNull(),
        },
        order: { lastActivity: 'DESC' },
      });
    });

    it('should return empty array when no active sessions', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findActiveSessions('user-999');

      expect(result).toEqual([]);
    });
  });

  describe('findActiveSessionsNotExpired', () => {
    it('should find active non-expired sessions for a user', async () => {
      const sessions = [mockSession];
      typeOrmRepository.find.mockResolvedValue(sessions as UserSessionEntity[]);

      const result = await repository.findActiveSessionsNotExpired('user-123');

      expect(result).toBe(sessions);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRevoked: false,
          deletedAt: IsNull(),
        },
        order: { lastActivity: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createData = {
        userId: 'user-123',
        refreshTokenHash: 'new-hash',
        deviceName: 'Firefox',
        ipAddress: '192.168.1.1',
        userAgent: 'Firefox/90',
        expiresAt: new Date('2025-12-31'),
      };

      const createdSession = { ...mockSession, ...createData };
      typeOrmRepository.create.mockReturnValue(createdSession as UserSessionEntity);
      typeOrmRepository.save.mockResolvedValue(createdSession as UserSessionEntity);

      const result = await repository.create(createData);

      expect(result).toBe(createdSession);
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        ...createData,
        lastActivity: expect.any(Date),
        isRevoked: false,
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdSession);
    });

    it('should create session without optional fields', async () => {
      const createData = {
        userId: 'user-123',
        refreshTokenHash: 'new-hash',
        ipAddress: '192.168.1.1',
        expiresAt: new Date('2025-12-31'),
      };

      const createdSession = { ...mockSession };
      typeOrmRepository.create.mockReturnValue(createdSession as UserSessionEntity);
      typeOrmRepository.save.mockResolvedValue(createdSession as UserSessionEntity);

      await repository.create(createData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        ...createData,
        lastActivity: expect.any(Date),
        isRevoked: false,
      });
    });
  });

  describe('updateLastActivity', () => {
    it('should update the last activity timestamp', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.updateLastActivity('session-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'session-123' },
        { lastActivity: expect.any(Date) },
      );
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.revokeSession('session-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'session-123' },
        { isRevoked: true },
      );
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      await repository.revokeAllUserSessions('user-123');

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UserSessionEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isRevoked: true });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userId = :userId', { userId: 'user-123' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('isRevoked = :isRevoked', {
        isRevoked: false,
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should revoke all sessions except a given session id', async () => {
      await repository.revokeAllUserSessions('user-123', 'session-keep');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('id != :exceptSessionId', {
        exceptSessionId: 'session-keep',
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should not add exceptSessionId clause when not provided', async () => {
      // Reset to count calls
      mockQueryBuilder.andWhere.mockClear();

      await repository.revokeAllUserSessions('user-123');

      // andWhere should only be called once (for isRevoked), not twice
      const calls = mockQueryBuilder.andWhere.mock.calls;
      const hasExceptCall = calls.some(
        (call: any[]) => call[0] && call[0].includes('exceptSessionId'),
      );
      expect(hasExceptCall).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a session', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.softDelete('session-123');

      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('session-123');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and return the count', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 5, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({
        expiresAt: expect.anything(), // LessThan(new Date())
      });
    });

    it('should return 0 when no sessions cleaned up', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: undefined, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });

  describe('cleanupRevokedSessions', () => {
    it('should cleanup revoked sessions older than default 30 days', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 3, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupRevokedSessions();

      expect(result).toBe(3);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({
        isRevoked: true,
        lastActivity: expect.anything(), // LessThan(cutoffDate)
      });
    });

    it('should cleanup revoked sessions older than given days', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 2, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupRevokedSessions(7);

      expect(result).toBe(2);
    });

    it('should return 0 when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: undefined, raw: {}, generatedMaps: [] });

      const result = await repository.cleanupRevokedSessions();

      expect(result).toBe(0);
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all active sessions for a user', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 3, raw: {}, generatedMaps: [] });

      await repository.revokeAllForUser('user-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRevoked: false },
        { isRevoked: true },
      );
    });
  });
});
