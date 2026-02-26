import { Test, TestingModule } from '@nestjs/testing';
import { UpdateMyProfileUseCase } from './update-my-profile.use-case';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';
import { UpdateUserMeRequestDto } from '../dto/update-user-profile.request.dto';

describe('UpdateMyProfileUseCase', () => {
  let useCase: UpdateMyProfileUseCase;
  let userRepo: jest.Mocked<UserTypeOrmRepository>;

  beforeEach(async () => {
    const mockUserRepo = {
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMyProfileUseCase,
        {
          provide: UserTypeOrmRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    useCase = module.get<UpdateMyProfileUseCase>(UpdateMyProfileUseCase);
    userRepo = module.get(UserTypeOrmRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update user profile with all fields', async () => {
      const userId = 'user-123';
      const dto: UpdateUserMeRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        language: 'fr',
        timezone: 'Europe/Paris',
        photoR2Key: 'photos/user-123.jpg',
      };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(userId, {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        language: 'fr',
        timezone: 'Europe/Paris',
        photoR2Key: 'photos/user-123.jpg',
      });
    });

    it('should update profile with partial data', async () => {
      const userId = 'user-456';
      const dto: UpdateUserMeRequestDto = {
        firstName: 'Jane',
      };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(userId, {
        firstName: 'Jane',
        lastName: undefined,
        phone: undefined,
        language: undefined,
        timezone: undefined,
        photoR2Key: undefined,
      });
    });

    it('should throw error when userId is empty string', async () => {
      const dto: UpdateUserMeRequestDto = { firstName: 'Test' };

      await expect(useCase.execute('', dto)).rejects.toThrow(
        'UpdateMyProfileUseCase called without userId',
      );

      expect(userRepo.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw error when userId is null', async () => {
      const dto: UpdateUserMeRequestDto = { firstName: 'Test' };

      await expect(useCase.execute(null as any, dto)).rejects.toThrow(
        'UpdateMyProfileUseCase called without userId',
      );

      expect(userRepo.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw error when userId is undefined', async () => {
      const dto: UpdateUserMeRequestDto = { firstName: 'Test' };

      await expect(useCase.execute(undefined as any, dto)).rejects.toThrow(
        'UpdateMyProfileUseCase called without userId',
      );

      expect(userRepo.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle updating only first name', async () => {
      const userId = 'user-789';
      const dto: UpdateUserMeRequestDto = { firstName: 'NewFirstName' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ firstName: 'NewFirstName' }),
      );
    });

    it('should handle updating only last name', async () => {
      const userId = 'user-abc';
      const dto: UpdateUserMeRequestDto = { lastName: 'NewLastName' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ lastName: 'NewLastName' }),
      );
    });

    it('should handle updating phone number', async () => {
      const userId = 'user-def';
      const dto: UpdateUserMeRequestDto = { phone: '+33699887766' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ phone: '+33699887766' }),
      );
    });

    it('should handle updating language', async () => {
      const userId = 'user-ghi';
      const dto: UpdateUserMeRequestDto = { language: 'en' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ language: 'en' }),
      );
    });

    it('should handle updating timezone', async () => {
      const userId = 'user-jkl';
      const dto: UpdateUserMeRequestDto = { timezone: 'America/New_York' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ timezone: 'America/New_York' }),
      );
    });

    it('should handle updating photo', async () => {
      const userId = 'user-mno';
      const dto: UpdateUserMeRequestDto = { photoR2Key: 'photos/new-photo.jpg' };

      userRepo.updateProfile.mockResolvedValue(undefined);

      await useCase.execute(userId, dto);

      expect(userRepo.updateProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ photoR2Key: 'photos/new-photo.jpg' }),
      );
    });
  });
});
