import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SeedService } from './seed.service';
import { RoleEntity } from 'src/infrastructure/database/entities/role.entity';
import { ContractEntity } from 'src/infrastructure/database/entities/contract.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { UserPreferenceEntity } from 'src/infrastructure/database/entities/user-preference.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SeedService', () => {
  let service: SeedService;
  let roleRepository: jest.Mocked<Repository<RoleEntity>>;
  let contractRepository: jest.Mocked<Repository<ContractEntity>>;
  let userRepository: jest.Mocked<Repository<EUser>>;
  let userPreferenceRepository: jest.Mocked<Repository<UserPreferenceEntity>>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContractEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EUser),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPreferenceEntity),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    roleRepository = module.get(getRepositoryToken(RoleEntity));
    contractRepository = module.get(getRepositoryToken(ContractEntity));
    userRepository = module.get(getRepositoryToken(EUser));
    userPreferenceRepository = module.get(getRepositoryToken(UserPreferenceEntity));

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
  });

  describe('seedAll', () => {
    it('should seed all data and return summary', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.message).toBe('Database seeding completed successfully');
      expect(result.details).toHaveProperty('roles');
      expect(result.details).toHaveProperty('contracts');
      expect(result.details).toHaveProperty('users');
      expect(loggerSpy).toHaveBeenCalledWith('Starting database seeding...');
      expect(loggerSpy).toHaveBeenCalledWith('Database seeding completed!');
    });

    it('should create all three roles', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.details.roles).toContain(Role.USER_FREEMIUM);
      expect(result.details.roles).toContain(Role.USER_PREMIUM);
      expect(result.details.roles).toContain(Role.USER_ADMIN);
      expect(roleRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should create all five contracts', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.details.contracts).toContain('netflix');
      expect(result.details.contracts).toContain('spotify');
      expect(result.details.contracts).toContain('amazon_prime');
      expect(result.details.contracts).toContain('disney_plus');
      expect(result.details.contracts).toContain('apple_music');
      expect(contractRepository.save).toHaveBeenCalledTimes(5);
    });

    it('should create all three users with preferences', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.details.users).toContain('sophie.martin@example.com');
      expect(result.details.users).toContain('pierre.dubois@example.com');
      expect(result.details.users).toContain('marie.lambert@example.com');
      expect(userRepository.save).toHaveBeenCalledTimes(3);
      expect(userPreferenceRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should skip existing roles', async () => {
      roleRepository.findOne.mockResolvedValue({
        key: Role.USER_FREEMIUM,
      } as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.details.roles).toHaveLength(0);
      expect(roleRepository.save).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Role already exists'));
    });

    it('should skip existing contracts', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue({ type: 'netflix' } as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      const result = await service.seedAll();

      expect(result.details.contracts).toHaveLength(0);
      expect(contractRepository.save).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Contract already exists'));
    });

    it('should skip existing users', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue({
        email: 'sophie.martin@example.com',
      } as any);

      const result = await service.seedAll();

      expect(result.details.users).toHaveLength(0);
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(userPreferenceRepository.save).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('User already exists'));
    });

    it('should hash user passwords with bcrypt', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      await service.seedAll();

      expect(bcrypt.hash).toHaveBeenCalledWith('Sophie2024!', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('Pierre2024!', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('Marie2024!', 12);
      expect(bcrypt.hash).toHaveBeenCalledTimes(3);
    });

    it('should save users with hashed passwords', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      await service.seedAll();

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'hashedPassword',
        }),
      );
    });

    it('should create user preferences with correct userId', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      await service.seedAll();

      expect(userPreferenceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        }),
      );
    });

    it('should log progress for each seeding step', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue({} as any);
      contractRepository.findOne.mockResolvedValue(null);
      contractRepository.save.mockResolvedValue({} as any);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ id: 'user-123' } as any);
      userPreferenceRepository.save.mockResolvedValue({} as any);

      await service.seedAll();

      expect(loggerSpy).toHaveBeenCalledWith('Seeding roles...');
      expect(loggerSpy).toHaveBeenCalledWith('Seeding contracts...');
      expect(loggerSpy).toHaveBeenCalledWith('Seeding users...');
    });
  });
});
