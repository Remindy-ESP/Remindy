import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserTypeOrmRepository } from './user-typeorm.repository';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

describe('UserTypeOrmRepository', () => {
  let repository: UserTypeOrmRepository;
  let typeOrmRepository: jest.Mocked<Repository<EUser>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTypeOrmRepository,
        {
          provide: getRepositoryToken(EUser),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserTypeOrmRepository>(UserTypeOrmRepository);
    typeOrmRepository = module.get(getRepositoryToken(EUser));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByIdWithPreferences', () => {
    it('should find user by id with preferences relation', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        preferences: { theme: 'dark' },
      } as EUser;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithPreferences(userId);

      expect(result).toBe(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: IsNull() },
        relations: ['preferences'],
      });
    });

    it('should return null when user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByIdWithPreferences('non-existent');

      expect(result).toBeNull();
    });

    it('should exclude soft deleted users', async () => {
      const userId = 'user-123';
      typeOrmRepository.findOne.mockResolvedValue(null);

      await repository.findByIdWithPreferences(userId);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: IsNull() }),
        }),
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123', email } as EUser;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(email);

      expect(result).toBe(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: email.toLowerCase().trim(), deletedAt: IsNull() },
      });
    });

    it('should normalize email to lowercase', async () => {
      const email = 'Test@Example.COM';
      const mockUser = { id: 'user-123', email: 'test@example.com' } as EUser;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      await repository.findByEmail(email);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: IsNull() },
      });
    });

    it('should trim whitespace from email', async () => {
      const email = '  test@example.com  ';
      const mockUser = { id: 'user-123', email: 'test@example.com' } as EUser;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      await repository.findByEmail(email);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: IsNull() },
      });
    });

    it('should return null when user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id using findByIdWithPreferences', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        preferences: {},
      } as EUser;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findById(userId);

      expect(result).toBe(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: IsNull() },
        relations: ['preferences'],
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-123';
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
      };

      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      await repository.updateProfile(userId, updateData);

      expect(typeOrmRepository.update).toHaveBeenCalledWith({ id: userId }, updateData);
    });

    it('should throw error when userId is not provided', async () => {
      const updateData = { firstName: 'John' };

      await expect(repository.updateProfile('', updateData)).rejects.toThrow(
        'updateProfile called without userId',
      );

      expect(typeOrmRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when userId is null', async () => {
      const updateData = { firstName: 'John' };

      await expect(repository.updateProfile(null as any, updateData)).rejects.toThrow(
        'updateProfile called without userId',
      );
    });

    it('should throw error when userId is undefined', async () => {
      const updateData = { firstName: 'John' };

      await expect(repository.updateProfile(undefined as any, updateData)).rejects.toThrow(
        'updateProfile called without userId',
      );
    });

    it('should allow partial updates', async () => {
      const userId = 'user-123';
      const updateData = { firstName: 'John' };

      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      await repository.updateProfile(userId, updateData);

      expect(typeOrmRepository.update).toHaveBeenCalledWith({ id: userId }, updateData);
    });
  });

  describe('save', () => {
    it('should save user entity', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
      } as EUser;

      typeOrmRepository.save.mockResolvedValue(user);

      const result = await repository.save(user);

      expect(result).toBe(user);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(user);
    });

    it('should handle save with all user properties', async () => {
      const user = {
        id: 'user-456',
        email: 'complete@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+33612345678',
        timezone: 'Europe/Paris',
        language: 'fr',
      } as EUser;

      typeOrmRepository.save.mockResolvedValue(user);

      const result = await repository.save(user);

      expect(result).toBe(user);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('create', () => {
    it('should create and save new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      const createdUser = {
        ...userData,
        id: 'user-new-123',
      } as EUser;

      typeOrmRepository.create.mockReturnValue(createdUser);
      typeOrmRepository.save.mockResolvedValue(createdUser);

      const result = await repository.create(userData);

      expect(result).toBe(createdUser);
      expect(typeOrmRepository.create).toHaveBeenCalledWith(userData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it('should create user with minimal data', async () => {
      const userData = {
        email: 'minimal@example.com',
      };

      const createdUser = {
        ...userData,
        id: 'user-minimal',
      } as EUser;

      typeOrmRepository.create.mockReturnValue(createdUser);
      typeOrmRepository.save.mockResolvedValue(createdUser);

      const result = await repository.create(userData);

      expect(result).toBe(createdUser);
      expect(typeOrmRepository.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('softDelete', () => {
    it('should soft delete user by id', async () => {
      const userId = 'user-123';

      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      await repository.softDelete(userId);

      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({ id: userId });
    });

    it('should handle soft delete for different user ids', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      for (const userId of userIds) {
        await repository.softDelete(userId);
        expect(typeOrmRepository.softDelete).toHaveBeenCalledWith({ id: userId });
      }

      expect(typeOrmRepository.softDelete).toHaveBeenCalledTimes(3);
    });
  });
});
