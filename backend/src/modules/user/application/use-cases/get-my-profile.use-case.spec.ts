import { Test, TestingModule } from '@nestjs/testing';
import { GetMyProfileUseCase } from './get-my-profile.use-case';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

describe('GetMyProfileUseCase', () => {
  let useCase: GetMyProfileUseCase;
  let userRepo: jest.Mocked<UserTypeOrmRepository>;

  beforeEach(async () => {
    const mockUserRepo = {
      findByIdWithPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyProfileUseCase,
        {
          provide: UserTypeOrmRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetMyProfileUseCase>(GetMyProfileUseCase);
    userRepo = module.get(UserTypeOrmRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return user profile when found', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        timezone: 'Europe/Paris',
        language: 'fr',
        preferences: {
          theme: 'dark',
          notificationEmail: true,
        },
      } as EUser;

      userRepo.findByIdWithPreferences.mockResolvedValue(mockUser);

      const result = await useCase.execute({ userId });

      expect(result).toBe(mockUser);
      expect(userRepo.findByIdWithPreferences).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      const userId = 'user-404';

      userRepo.findByIdWithPreferences.mockResolvedValue(null);

      await expect(useCase.execute({ userId })).rejects.toThrow('User not found');
    });

    it('should include user preferences in result', async () => {
      const userId = 'user-456';
      const mockUser = {
        id: userId,
        email: 'withprefs@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        preferences: {
          theme: 'light',
          notificationEmail: false,
          notificationPush: true,
          currency: 'USD',
        },
      } as EUser;

      userRepo.findByIdWithPreferences.mockResolvedValue(mockUser);

      const result = await useCase.execute({ userId });

      expect(result.preferences).toBeDefined();
      expect(result.preferences).toEqual(mockUser.preferences);
    });

    it('should handle different user ids', async () => {
      const users = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
        { id: 'user-3', email: 'user3@example.com' },
      ];

      for (const user of users) {
        const mockUser = {
          id: user.id,
          email: user.email,
          firstName: 'Test',
          lastName: 'User',
        } as EUser;

        userRepo.findByIdWithPreferences.mockResolvedValue(mockUser);

        const result = await useCase.execute({ userId: user.id });

        expect(result.id).toBe(user.id);
        expect(result.email).toBe(user.email);
        expect(userRepo.findByIdWithPreferences).toHaveBeenCalledWith(user.id);
      }
    });

    it('should return user with all profile fields', async () => {
      const userId = 'user-complete';
      const mockUser = {
        id: userId,
        email: 'complete@example.com',
        firstName: 'Complete',
        lastName: 'Profile',
        phone: '+33699887766',
        timezone: 'America/New_York',
        language: 'en',
        photoR2Key: 'photos/user-complete.jpg',
        preferences: {
          theme: 'auto',
          defaultReminderDelay: 7,
        },
      } as EUser;

      userRepo.findByIdWithPreferences.mockResolvedValue(mockUser);

      const result = await useCase.execute({ userId });

      expect(result.id).toBe(userId);
      expect(result.email).toBe('complete@example.com');
      expect(result.firstName).toBe('Complete');
      expect(result.lastName).toBe('Profile');
      expect(result.phone).toBe('+33699887766');
      expect(result.timezone).toBe('America/New_York');
      expect(result.language).toBe('en');
      expect(result.photoR2Key).toBe('photos/user-complete.jpg');
    });
  });
});
