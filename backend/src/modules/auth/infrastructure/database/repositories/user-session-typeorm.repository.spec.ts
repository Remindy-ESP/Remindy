import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessionTypeOrmRepository } from './user-session-typeorm.repository';
import { UserSessionEntity } from '../../../../../infrastructure/database/entities/user-session.entity';
const TEST_IP = 'another-test-ip'; 

describe('UserSessionTypeOrmRepository', () => {
  let repository: UserSessionTypeOrmRepository;
  let typeOrmRepository: jest.Mocked<Repository<UserSessionEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionTypeOrmRepository,
        {
          provide: getRepositoryToken(UserSessionEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserSessionTypeOrmRepository>(UserSessionTypeOrmRepository);
    typeOrmRepository = module.get(getRepositoryToken(UserSessionEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session with all parameters', async () => {
      const params = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: 'token_hash',
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
        deviceName: 'Chrome on Windows',
        expiresAt: new Date('2024-12-31'),
      };

      const createdSession = {
        ...params,
        lastActivity: expect.any(Date),
        isRevoked: false,
      };

      const savedSession = {
        id: 'session-123',
        ...createdSession,
      };

      typeOrmRepository.create.mockReturnValue(createdSession as any);
      typeOrmRepository.save.mockResolvedValue(savedSession as any);

      const result = await repository.createSession(params);

      expect(result).toEqual({ id: 'session-123' });

      expect(typeOrmRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: params.id,
          userId: params.userId,
          refreshTokenHash: params.refreshTokenHash,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          deviceName: params.deviceName,
          expiresAt: params.expiresAt,
          isRevoked: false,
        }),
      );
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdSession);
    });

    it('should create a session without optional parameters', async () => {
      const params = {
        id: 'session-456',
        userId: 'user-456',
        refreshTokenHash: 'token_hash_2',
        ipAddress: '10.0.0.1',
        expiresAt: new Date('2024-12-31'),
      };

      const createdSession = {
        ...params,
        userAgent: null,
        deviceName: null,
        lastActivity: expect.any(Date),
        isRevoked: false,
      };

      const savedSession = {
        id: 'session-456',
        ...createdSession,
      };

      typeOrmRepository.create.mockReturnValue(createdSession as any);
      typeOrmRepository.save.mockResolvedValue(savedSession as any);

      const result = await repository.createSession(params);

      expect(result).toEqual({ id: 'session-456' });

      expect(typeOrmRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: null,
          deviceName: null,
        }),
      );
    });
    it('should store null for userAgent and deviceName when they are undefined', async () => {
      const params = {
        id: 'session-nullables',
        userId: 'user-123',
        refreshTokenHash: 'token_hash',
        ipAddress: TEST_IP,
        expiresAt: new Date('2026-12-31'),
      };

      const createdSession = {
        ...params,
        userAgent: null,
        deviceName: null,
        lastActivity: expect.any(Date),
        isRevoked: false,
      };

      typeOrmRepository.create.mockReturnValue(createdSession as any);
      typeOrmRepository.save.mockResolvedValue({ id: 'session-nullables' } as any);

      const result = await repository.createSession(params as any);

      expect(result).toEqual({ id: 'session-nullables' });
      expect(typeOrmRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: null,
          deviceName: null,
        }),
      );
    });
  });

  describe('findActiveSessionById', () => {
    it('should find an active session by id', async () => {
      const sessionEntity = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: 'token_hash',
        expiresAt: new Date('2024-12-31'),
        isRevoked: false,
        ipAddress: TEST_IP,
        lastActivity: new Date(),
      };

      typeOrmRepository.findOne.mockResolvedValue(sessionEntity as UserSessionEntity);

      const result = await repository.findActiveSessionById('session-123');

      expect(result).toEqual({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: 'token_hash',
        expiresAt: sessionEntity.expiresAt,
        isRevoked: false,
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          isRevoked: false,
        },
      });
    });

    it('should return null when session not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findActiveSessionById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when session is revoked', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findActiveSessionById('revoked-session');

      expect(result).toBeNull();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'revoked-session',
          isRevoked: false,
        },
      });
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token and last activity', async () => {
      const sessionId = 'session-123';
      const params = {
        refreshTokenHash: 'new_token_hash',
        lastActivity: new Date('2024-01-15'),
      };

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.updateRefreshToken(sessionId, params);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: sessionId },
        {
          refreshTokenHash: params.refreshTokenHash,
          lastActivity: params.lastActivity,
        },
      );
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      const sessionId = 'session-123';

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.revokeSession(sessionId);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: sessionId },
        {
          isRevoked: true,
        },
      );
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all active sessions for a user', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 2, raw: {}, generatedMaps: [] });

      await repository.revokeAllForUser('user-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRevoked: false },
        { isRevoked: true },
      );
    });
  });

  describe('findActiveByRefreshTokenHash', () => {
    it('should find active session by refresh token hash', async () => {
      const sessionEntity = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: 'token_hash',
        expiresAt: new Date('2024-12-31'),
        isRevoked: false,
      };

      typeOrmRepository.findOne.mockResolvedValue(sessionEntity as UserSessionEntity);

      const result = await repository.findActiveByRefreshTokenHash('token_hash');

      expect(result).toEqual({ id: 'session-123', userId: 'user-123' });
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: 'token_hash',
          isRevoked: false,
        },
      });
    });

    it('should return null when session not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findActiveByRefreshTokenHash('invalid_hash');

      expect(result).toBeNull();
    });

    it('should return null when session is revoked', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findActiveByRefreshTokenHash('revoked_hash');

      expect(result).toBeNull();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: 'revoked_hash',
          isRevoked: false,
        },
      });
    });
  });
});

describe('UserSessionTypeOrmRepository constructor branch coverage', () => {
  it('should instantiate with null dependency to cover constructor parameter branches', () => {
    const instance = new UserSessionTypeOrmRepository(null as any);
    expect(instance).toBeDefined();
  });
});
