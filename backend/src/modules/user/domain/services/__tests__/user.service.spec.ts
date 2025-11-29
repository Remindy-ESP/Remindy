import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user.service';
import { UserRepository } from '../../../infrastructure/repositories/user-typeorm.repository ';
import { UserPreferencesRepository } from '../../../infrastructure/repositories/user-preferences.repository';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678',
    photoR2Key: null,
    role: 'user_premium',
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
    };

    const mockUserPreferencesRepository = {
      findByUserId: jest.fn(),
      createDefaultPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockUserPreferencesRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
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
        role: mockUser.role,
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

      userRepository.findById.mockResolvedValue(mockUser as any);
      userRepository.updateProfile.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      } as any);

      const result = await service.updateUserProfile('user-123', updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.phone).toBe('+33698765432');
      expect(result.timezone).toBe('America/New_York');
      expect(result.language).toBe('en');
      expect(userRepository.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
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

      userRepository.findById.mockResolvedValue(mockUser as any);
      userRepository.updateProfile.mockResolvedValue({
        ...mockUser,
        firstName: 'UpdatedName',
      } as any);

      const result = await service.updateUserProfile('user-123', updateDto);

      expect(result.firstName).toBe('UpdatedName');
      expect(userRepository.updateProfile).toHaveBeenCalled();
    });
  });
});
