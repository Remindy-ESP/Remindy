import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserAuthTypeOrmRepository } from './user-auth-typeorm.repository';
import { EUser, UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { UserOrmMapper } from '../../mappers/user-orm.mapper';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { Role } from '../../../domain/value-objects/role.enum';

describe('UserAuthTypeOrmRepository', () => {
  let repository: UserAuthTypeOrmRepository;
  let typeOrmRepository: jest.Mocked<Repository<EUser>>;
  let mapper: jest.Mocked<UserOrmMapper>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockMapper = {
      toDomain: jest.fn(),
      toOrm: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthTypeOrmRepository,
        {
          provide: getRepositoryToken(EUser),
          useValue: mockTypeOrmRepository,
        },
        {
          provide: UserOrmMapper,
          useValue: mockMapper,
        },
      ],
    }).compile();

    repository = module.get<UserAuthTypeOrmRepository>(UserAuthTypeOrmRepository);
    typeOrmRepository = module.get(getRepositoryToken(EUser));
    mapper = module.get(UserOrmMapper);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const entity = new EUser();
      entity.id = 'user-123';
      entity.email = 'test@example.com';
      entity.passwordHash = 'hashed_password';
      entity.role_key = Role.USER_FREEMIUM;
      entity.firstName = 'John';
      entity.lastName = 'Doe';
      entity.status = UserStatus.ACTIVE;
      entity.failedLoginCount = 0;
      entity.emailVerified = false;
      entity.mfaEnabled = false;

      const domainUser = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      typeOrmRepository.findOne.mockResolvedValue(entity);
      mapper.toDomain.mockReturnValue(domainUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toBe(domainUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should return null when user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(mapper.toDomain).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save a new user', async () => {
      const domainUser = new AuthUser({
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'New',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      const ormEntity = {
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'New',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      } as Partial<EUser>;

      const savedEntity = new EUser();
      Object.assign(savedEntity, ormEntity);
      savedEntity.id = 'user-new-123';
      savedEntity.createdAt = new Date();

      const savedDomainUser = new AuthUser({
        id: 'user-new-123',
        ...ormEntity,
        createdAt: savedEntity.createdAt,
      });

      mapper.toOrm.mockReturnValue(ormEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);
      mapper.toDomain.mockReturnValue(savedDomainUser);

      const result = await repository.save(domainUser);

      expect(result).toBe(savedDomainUser);
      expect(mapper.toOrm).toHaveBeenCalledWith(domainUser);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(ormEntity);
      expect(mapper.toDomain).toHaveBeenCalledWith(savedEntity);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const entity = new EUser();
      entity.id = 'user-123';
      entity.email = 'test@example.com';
      entity.passwordHash = 'hashed_password';
      entity.role_key = Role.USER_FREEMIUM;
      entity.firstName = 'John';
      entity.lastName = 'Doe';
      entity.status = UserStatus.ACTIVE;
      entity.failedLoginCount = 0;
      entity.emailVerified = false;
      entity.mfaEnabled = false;

      const domainUser = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      typeOrmRepository.findOne.mockResolvedValue(entity);
      mapper.toDomain.mockReturnValue(domainUser);

      const result = await repository.findById('user-123');

      expect(result).toBe(domainUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'user-123',
          deletedAt: IsNull(),
        },
      });
      expect(mapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should return null when user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
      expect(mapper.toDomain).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    it('should update user password and reset failed login count', async () => {
      const userId = 'user-123';
      const newPasswordHash = 'new_hashed_password';

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.updatePassword(userId, newPasswordHash);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: userId },
        {
          passwordHash: newPasswordHash,
          passwordChangedAt: expect.any(Date),
          failedLoginCount: 0,
        },
      );
    });

    it('should update password with current timestamp', async () => {
      const userId = 'user-456';
      const newPasswordHash = 'another_hashed_password';
      const beforeUpdate = new Date();

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.updatePassword(userId, newPasswordHash);

      const afterUpdate = new Date();
      const call = typeOrmRepository.update.mock.calls[0];
      const updateData = call[1] as any;

      expect(updateData.passwordChangedAt).toBeInstanceOf(Date);
      expect(updateData.passwordChangedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updateData.passwordChangedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('incrementFailedLoginCount', () => {
    it('increments the failed login counter', async () => {
      (typeOrmRepository as any).increment = jest.fn().mockResolvedValue(undefined);

      await repository.incrementFailedLoginCount('user-123');

      expect((typeOrmRepository as any).increment).toHaveBeenCalledWith(
        { id: 'user-123' },
        'failedLoginCount',
        1,
      );
    });
  });

  describe('resetFailedLoginCount', () => {
    it('resets the failed login counter to zero', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.resetFailedLoginCount('user-123');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'user-123' },
        { failedLoginCount: 0 },
      );
    });
  });

  describe('updateLastLoginAt', () => {
    it('updates lastLoginAt with the provided date', async () => {
      const date = new Date('2025-01-20T10:00:00.000Z');
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await repository.updateLastLoginAt('user-123', date);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'user-123' },
        { lastLoginAt: date },
      );
    });
  });
});