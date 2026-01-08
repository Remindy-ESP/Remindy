import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateQueryBuilder } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';
import { UserSessionEntity } from '../../../../infrastructure/database/entities/user-session.entity';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let typeOrmRepository: jest.Mocked<Repository<UserSessionEntity>>;
  let updateQueryBuilder: jest.Mocked<UpdateQueryBuilder<UserSessionEntity>>;

  beforeEach(async () => {
    updateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as any;

    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(updateQueryBuilder),
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

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a session by id', async () => {
      const session = new UserSessionEntity();
      session.id = 'session-123';
      session.userId = 'user-123';
      session.refreshTokenHash = 'hash123';
      session.ipAddress = '192.168.1.1';
      session.expiresAt = new Date();
      session.isRevoked = false;
      session.lastActivity = new Date();
      session.createdAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(session);

      const result = await repository.findById('session-123');

      expect(result).toEqual(session);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-123', deletedAt: expect.anything() },
      });
    });

    it('should return null when session not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByRefreshTokenHash', () => {
    it('should find a session by refresh token hash', async () => {
      const session = new UserSessionEntity();
      session.id = 'session-123';
      session.userId = 'user-123';
      session.refreshTokenHash = 'hash123';
      session.ipAddress = '192.168.1.1';
      session.expiresAt = new Date();
      session.isRevoked = false;
      session.lastActivity = new Date();
      session.createdAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(session);

      const result = await repository.findByRefreshTokenHash('hash123');

      expect(result).toEqual(session);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: 'hash123',
          isRevoked: false,
          deletedAt: expect.anything(),
        },
      });
    });

    it('should return null when session not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByRefreshTokenHash('invalid-hash');

      expect(result).toBeNull();
    });

    it('should return null when session is revoked', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByRefreshTokenHash('hash123');

      expect(result).toBeNull();
    });
  });

  describe('findActiveSessions', () => {
    it('should find all active sessions for a user', async () => {
      const sessions = [
        Object.assign(new UserSessionEntity(), {
          id: 'session-1',
          userId: 'user-123',
          refreshTokenHash: 'hash1',
          ipAddress: '192.168.1.1',
          expiresAt: new Date(),
          isRevoked: false,
          lastActivity: new Date('2024-01-02'),
          createdAt: new Date(),
        }),
        Object.assign(new UserSessionEntity(), {
          id: 'session-2',
          userId: 'user-123',
          refreshTokenHash: 'hash2',
          ipAddress: '192.168.1.2',
          expiresAt: new Date(),
          isRevoked: false,
          lastActivity: new Date('2024-01-01'),
          createdAt: new Date(),
        }),
      ];

      typeOrmRepository.find.mockResolvedValue(sessions);

      const result = await repository.findActiveSessions('user-123');

      expect(result).toHaveLength(2);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRevoked: false,
          deletedAt: expect.anything(),
        },
        order: {
          lastActivity: 'DESC',
        },
      });
    });

    it('should return empty array when no active sessions', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findActiveSessions('user-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('findActiveSessionsNotExpired', () => {
    it('should find all active non-expired sessions for a user', async () => {
      const sessions = [
        Object.assign(new UserSessionEntity(), {
          id: 'session-1',
          userId: 'user-123',
          refreshTokenHash: 'hash1',
          ipAddress: '192.168.1.1',
          expiresAt: new Date(Date.now() + 86400000),
          isRevoked: false,
          lastActivity: new Date(),
          createdAt: new Date(),
        }),
      ];

      typeOrmRepository.find.mockResolvedValue(sessions);

      const result = await repository.findActiveSessionsNotExpired('user-123');

      expect(result).toHaveLength(1);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRevoked: false,
          deletedAt: expect.anything(),
        },
        order: {
          lastActivity: 'DESC',
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const sessionData = {
        userId: 'user-123',
        refreshTokenHash: 'hash123',
        deviceName: 'iPhone 13',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date('2024-12-31'),
      };

      const createdSession = new UserSessionEntity();
      Object.assign(createdSession, {
        ...sessionData,
        id: 'session-123',
        lastActivity: expect.any(Date),
        isRevoked: false,
        createdAt: new Date(),
      });

      typeOrmRepository.create.mockReturnValue(createdSession as any);
      typeOrmRepository.save.mockResolvedValue(createdSession);

      const result = await repository.create(sessionData);

      expect(result).toEqual(createdSession);
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        ...sessionData,
        lastActivity: expect.any(Date),
        isRevoked: false,
      });
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should create a session without optional fields', async () => {
      const sessionData = {
        userId: 'user-123',
        refreshTokenHash: 'hash123',
        ipAddress: '192.168.1.1',
        expiresAt: new Date('2024-12-31'),
      };

      const createdSession = new UserSessionEntity();
      Object.assign(createdSession, {
        ...sessionData,
        id: 'session-123',
        lastActivity: expect.any(Date),
        isRevoked: false,
        createdAt: new Date(),
      });

      typeOrmRepository.create.mockReturnValue(createdSession as any);
      typeOrmRepository.save.mockResolvedValue(createdSession);

      const result = await repository.create(sessionData);

      expect(result).toEqual(createdSession);
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        ...sessionData,
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
        { lastActivity: expect.any(Date) }
      );
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.revokeSession('session-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'session-123' },
        { isRevoked: true }
      );
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: 3, raw: {} });

      await repository.revokeAllUserSessions('user-123');

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalled();
      expect(updateQueryBuilder.update).toHaveBeenCalledWith(UserSessionEntity);
      expect(updateQueryBuilder.set).toHaveBeenCalledWith({ isRevoked: true });
      expect(updateQueryBuilder.where).toHaveBeenCalledWith('userId = :userId', { userId: 'user-123' });
      expect(updateQueryBuilder.andWhere).toHaveBeenCalledWith('isRevoked = :isRevoked', { isRevoked: false });
      expect(updateQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should revoke all sessions except one', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: 2, raw: {} });

      await repository.revokeAllUserSessions('user-123', 'session-keep');

      expect(updateQueryBuilder.andWhere).toHaveBeenCalledWith('id != :exceptSessionId', {
        exceptSessionId: 'session-keep',
      });
      expect(updateQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a session', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: []
      });

      await repository.softDelete('session-123');

      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('session-123');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions and return count', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 5,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({
        expiresAt: expect.anything(),
      });
    });

    it('should return 0 when no sessions expired', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: undefined,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });

    it('should return 0 when affected is null', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: null as any,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });

  describe('cleanupRevokedSessions', () => {
    it('should delete revoked sessions older than default 30 days', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 3,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupRevokedSessions();

      expect(result).toBe(3);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({
        isRevoked: true,
        lastActivity: expect.anything(),
      });
    });

    it('should delete revoked sessions older than custom days', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 7,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupRevokedSessions(60);

      expect(result).toBe(7);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({
        isRevoked: true,
        lastActivity: expect.anything(),
      });
    });

    it('should return 0 when no revoked sessions to clean', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupRevokedSessions(30);

      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: undefined,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.cleanupRevokedSessions(30);

      expect(result).toBe(0);
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all active sessions for a user', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 4, raw: {}, generatedMaps: [] });

      await repository.revokeAllForUser('user-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRevoked: false },
        { isRevoked: true }
      );
    });

    it('should handle when user has no active sessions', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await repository.revokeAllForUser('user-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRevoked: false },
        { isRevoked: true }
      );
    });
  });
});
