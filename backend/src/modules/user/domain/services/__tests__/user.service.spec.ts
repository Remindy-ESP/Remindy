import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user.service';
import { UserTypeOrmRepository } from '../../../infrastructure/repositories/user-typeorm.repository';
import { UserPreferencesRepository } from '../../../infrastructure/repositories/user-preferences.repository';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserTypeOrmRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678',
    photoR2Key: null,
    role_key: 'user_premium',
    status: 'verified',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    mfaEnabled: false,
    lastLoginAt: new Date('2025-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByIdWithPreferences: jest.fn(),
      updateProfile: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockUserPreferencesRepository = {
      findByUserId: jest.fn(),
      createDefaultPreferences: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserTypeOrmRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserTypeOrmRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      userRepository.findByIdWithPreferences.mockResolvedValue(mockUser as any);

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        phone: mockUser.phone,
        photoR2Key: mockUser.photoR2Key,
        role_key: mockUser.role_key,
        status: mockUser.status,
        timezone: mockUser.timezone,
        language: mockUser.language,
        emailVerified: mockUser.emailVerified,
        mfaEnabled: mockUser.mfaEnabled,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(userRepository.findByIdWithPreferences).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findByIdWithPreferences.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.getUserProfile('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+33698765432',
        timezone: 'America/New_York',
        language: 'en',
      };

      const updatedUser = {
        ...mockUser,
        ...updateDto,
        updatedAt: new Date('2025-01-16T10:00:00Z'),
      };

      userRepository.findById.mockResolvedValueOnce(mockUser as any);
      userRepository.findById.mockResolvedValueOnce(updatedUser as any);

      const result = await service.updateUserProfile('user-123', updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.phone).toBe('+33698765432');
      expect(result.timezone).toBe('America/New_York');
      expect(result.language).toBe('en');
      expect(userRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+33698765432',
        timezone: 'America/New_York',
        language: 'en',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUserProfile('nonexistent-id', { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      const updateDto = {
        phone: 'invalid',
      };

      userRepository.findById.mockResolvedValue(mockUser as any);

      await expect(service.updateUserProfile('user-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUserProfile('user-123', updateDto)).rejects.toThrow(
        'Invalid phone number format',
      );
    });

    it('should throw BadRequestException for invalid timezone', async () => {
      const updateDto = {
        timezone: 'Invalid/Timezone',
      };

      userRepository.findById.mockResolvedValue(mockUser as any);

      await expect(service.updateUserProfile('user-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUserProfile('user-123', updateDto)).rejects.toThrow(
        'Invalid timezone',
      );
    });

    it('should accept undefined phone and timezone', async () => {
      const updateDto = {
        firstName: 'UpdatedName',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'UpdatedName',
        updatedAt: new Date('2025-01-16T10:00:00Z'),
      };

      userRepository.findById.mockResolvedValueOnce(mockUser as any);
      userRepository.findById.mockResolvedValueOnce(updatedUser as any);

      const result = await service.updateUserProfile('user-123', updateDto);

      expect(result.firstName).toBe('UpdatedName');
      expect(userRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        firstName: 'UpdatedName',
      });
    });

    it('should throw NotFoundException when user not found after update', async () => {
      const updateDto = { firstName: 'Jane' };

      // First call: user found; second call (after update): user not found
      userRepository.findById
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(null);

      await expect(service.updateUserProfile('user-123', updateDto)).rejects.toThrow(
        'User not found after update',
      );
    });

    it('should accept empty string phone (falsy) without phone format validation', async () => {
      const updateDto = { phone: '' };

      const updatedUser = { ...mockUser, phone: '' };
      userRepository.findById.mockResolvedValueOnce(mockUser as any);
      userRepository.findById.mockResolvedValueOnce(updatedUser as any);

      const result = await service.updateUserProfile('user-123', updateDto);

      // empty string is falsy → isValidPhoneNumber not called → no exception
      expect(result.phone).toBe('');
    });
  });

  describe('deleteAccount', () => {
    let userPreferencesRepository: jest.Mocked<{
      findByUserId: jest.Mock;
      createDefaultPreferences: jest.Mock;
      softDelete: jest.Mock;
    }>;

    beforeEach(() => {
      // Re-read the mocked instance from the module through service internals
      // The service was set up in outer beforeEach; we access it via the module.
      // We access it by calling service methods that invoke the repo.
      // The mock is already set in the outer beforeEach.
    });

    it('should delete account successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);

      // Access the preferences mock from the module
      const module = (service as any);
      const prefsRepo = module['userPreferencesRepository'] as jest.Mocked<any>;
      prefsRepo.softDelete = jest.fn().mockResolvedValue(undefined);
      userRepository.softDelete = jest.fn().mockResolvedValue(undefined);

      await service.deleteAccount('user-123');

      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(prefsRepo.softDelete).toHaveBeenCalledWith('user-123');
      expect(userRepository.softDelete).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.deleteAccount('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
