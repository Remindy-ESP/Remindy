import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../../domain/services/user.service';
import { UserPreferencesService } from '../../domain/services/user-preferences.service';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { GetMyPreferencesUseCase } from '../../application/use-cases/get-my-preferences.use-case';
import { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import { RequestRgpdExportUseCase } from '../../application/use-cases/request-rgpd-export.use-case';
import { RgpdExportService } from '../../../user/application/services/rgpd-export.service';
import { CloudflareR2Service } from 'src/modules/document/infrastructure/services/cloudflare-r2.service';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import type { Request, Response } from 'express';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(userId: string, overrides: Record<string, unknown> = {}): Request {
  return {
    user: { userId, role: Role.USER_PREMIUM },
    ip: '192.168.1.1',
    socket: { remoteAddress: '192.168.1.1' },
    ...overrides,
  } as unknown as Request;
}

function makeResponse(): jest.Mocked<Response> {
  return {
    clearCookie: jest.fn(),
  } as unknown as jest.Mocked<Response>;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+33612345678',
  photoR2Key: null,
  role_key: Role.USER_PREMIUM,
  status: UserStatus.VERIFIED,
  timezone: 'Europe/Paris',
  language: 'fr',
  emailVerified: true,
  mfaEnabled: false,
  lastLoginAt: new Date('2025-01-15'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2025-01-15'),
};

const mockUserEntity = {
  ...mockUserProfile,
  role_key: Role.USER_PREMIUM,
};

const mockPreferences = {
  userId: 'user-123',
  theme: 'dark',
  notificationEmail: true,
  notificationPush: false,
  notificationSms: false,
  defaultReminderDelay: 3,
  currency: 'EUR',
  showOnlineStatus: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockExportResponse = {
  id: 'export-123',
  userId: 'user-123',
  status: 'pending',
  format: 'json',
  requestedBy: 'user',
  createdAt: new Date(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let getMyProfileUseCase: jest.Mocked<GetMyProfileUseCase>;
  let updateMyProfileUseCase: jest.Mocked<UpdateMyProfileUseCase>;
  let getMyPreferencesUseCase: jest.Mocked<GetMyPreferencesUseCase>;
  let updateUserPreferencesUseCase: jest.Mocked<UpdateUserPreferencesUseCase>;
  let rgpdExportService: jest.Mocked<RgpdExportService>;
  let r2Service: jest.Mocked<CloudflareR2Service>;

  beforeEach(async () => {
    const mockUserService = {
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      deleteAccount: jest.fn(),
    };

    const mockUserPreferencesService = {
      getUserPreferences: jest.fn(),
      updateUserPreferences: jest.fn(),
    };

    const mockGetMyProfileUseCase = {
      execute: jest.fn(),
    };

    const mockUpdateMyProfileUseCase = {
      execute: jest.fn(),
    };

    const mockGetMyPreferencesUseCase = {
      execute: jest.fn(),
    };

    const mockUpdateUserPreferencesUseCase = {
      execute: jest.fn(),
    };

    const mockRequestRgpdExportUseCase = {
      execute: jest.fn(),
    };

    const mockRgpdExportService = {
      createExportRequest: jest.fn(),
      getExportStatus: jest.fn(),
      getUserExports: jest.fn(),
      processExport: jest.fn(),
    };

    const mockR2Service = {
      uploadFile: jest.fn(),
      getSignedUrl: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: UserPreferencesService, useValue: mockUserPreferencesService },
        { provide: GetMyProfileUseCase, useValue: mockGetMyProfileUseCase },
        { provide: UpdateMyProfileUseCase, useValue: mockUpdateMyProfileUseCase },
        { provide: GetMyPreferencesUseCase, useValue: mockGetMyPreferencesUseCase },
        { provide: UpdateUserPreferencesUseCase, useValue: mockUpdateUserPreferencesUseCase },
        { provide: RequestRgpdExportUseCase, useValue: mockRequestRgpdExportUseCase },
        { provide: RgpdExportService, useValue: mockRgpdExportService },
        { provide: CloudflareR2Service, useValue: mockR2Service },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    getMyProfileUseCase = module.get(GetMyProfileUseCase);
    updateMyProfileUseCase = module.get(UpdateMyProfileUseCase);
    getMyPreferencesUseCase = module.get(GetMyPreferencesUseCase);
    updateUserPreferencesUseCase = module.get(UpdateUserPreferencesUseCase);
    rgpdExportService = module.get(RgpdExportService);
    r2Service = module.get(CloudflareR2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('should return user profile', async () => {
      userService.getUserProfile.mockResolvedValue(mockUserProfile as any);

      const req = makeRequest('user-123');
      const result = await controller.getProfile(req);

      expect(result).toBe(mockUserProfile);
      expect(userService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user is not in request', async () => {
      const req = { user: null } as unknown as Request;

      await expect(controller.getProfile(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('should return current user profile without photo', async () => {
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      getMyProfileUseCase.execute.mockResolvedValue(userWithNoPhoto as any);

      const req = makeRequest('user-123');
      const result = await controller.getMe(req);

      expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should return current user profile with signed photo URL', async () => {
      const userWithPhoto = { ...mockUserEntity, photoR2Key: 'users/user-123/photo.jpg' };
      getMyProfileUseCase.execute.mockResolvedValue(userWithPhoto as any);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/signed-url');

      const req = makeRequest('user-123');
      const result = await controller.getMe(req);

      expect(r2Service.getSignedUrl).toHaveBeenCalledWith('users/user-123/photo.jpg', 86400);
      expect(result.photoUrl).toBe('https://cdn.example.com/signed-url');
    });

    it('should return profile even if signed URL generation fails', async () => {
      const userWithPhoto = { ...mockUserEntity, photoR2Key: 'users/user-123/photo.jpg' };
      getMyProfileUseCase.execute.mockResolvedValue(userWithPhoto as any);
      r2Service.getSignedUrl.mockRejectedValue(new Error('R2 error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const req = makeRequest('user-123');
      const result = await controller.getMe(req);

      expect(result.id).toBe('user-123');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ─── updateMe ──────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('should update current user and return updated profile', async () => {
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      getMyProfileUseCase.execute.mockResolvedValue(userWithNoPhoto as any);

      const req = makeRequest('user-123');
      const dto = { firstName: 'Jane' };

      const result = await controller.updateMe(req, dto);

      expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-123', dto);
      expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(result.id).toBe('user-123');
    });

    it('should return profile with signed URL when photo exists after update', async () => {
      const userWithPhoto = { ...mockUserEntity, photoR2Key: 'users/user-123/photo.jpg' };
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      getMyProfileUseCase.execute.mockResolvedValue(userWithPhoto as any);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/signed-url');

      const req = makeRequest('user-123');
      const result = await controller.updateMe(req, {});

      expect(result.photoUrl).toBe('https://cdn.example.com/signed-url');
    });
  });

  // ─── uploadMyPhoto ─────────────────────────────────────────────────────────

  describe('uploadMyPhoto', () => {
    const validFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'profile.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
      size: 1024,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should throw BadRequestException when file is missing', async () => {
      const req = makeRequest('user-123');

      await expect(controller.uploadMyPhoto(req, undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadMyPhoto(req, undefined as any)).rejects.toThrow(
        'File is required',
      );
    });

    it('should throw BadRequestException when file is empty', async () => {
      const emptyFile = { ...validFile, size: 0 };
      const req = makeRequest('user-123');

      await expect(controller.uploadMyPhoto(req, emptyFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadMyPhoto(req, emptyFile)).rejects.toThrow('File is empty');
    });

    it('should throw BadRequestException when file exceeds 5MB', async () => {
      const bigFile = { ...validFile, size: 6 * 1024 * 1024 };
      const req = makeRequest('user-123');

      await expect(controller.uploadMyPhoto(req, bigFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadMyPhoto(req, bigFile)).rejects.toThrow(
        'Profile photo size exceeds 5MB limit',
      );
    });

    it('should throw BadRequestException for unsupported mime type', async () => {
      const gifFile = { ...validFile, mimetype: 'image/gif' };
      const req = makeRequest('user-123');

      await expect(controller.uploadMyPhoto(req, gifFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadMyPhoto(req, gifFile)).rejects.toThrow(
        'Unsupported image type',
      );
    });

    it('should upload jpeg photo successfully and delete old photo', async () => {
      const userWithOldPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/old-photo.jpg',
      };
      const userWithNewPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/new-photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithOldPhoto as any) // before upload
        .mockResolvedValueOnce(userWithNewPhoto as any); // after upload

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.deleteFile.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/new-url');

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, validFile);

      expect(r2Service.uploadFile).toHaveBeenCalled();
      expect(r2Service.deleteFile).toHaveBeenCalledWith('users/user-123/old-photo.jpg');
      expect(result.id).toBe('user-123');
    });

    it('should upload photo successfully when no previous photo exists', async () => {
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/new-photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/signed-url');

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, validFile);

      // No old photo → deleteFile not called with old key
      expect(r2Service.deleteFile).not.toHaveBeenCalled();
      expect(result.id).toBe('user-123');
    });

    it('should rollback and delete new photo if upload pipeline fails', async () => {
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      getMyProfileUseCase.execute.mockResolvedValue(userWithNoPhoto as any);
      r2Service.uploadFile.mockRejectedValue(new Error('Upload failed'));
      r2Service.deleteFile.mockResolvedValue(undefined);

      const req = makeRequest('user-123');

      await expect(controller.uploadMyPhoto(req, validFile)).rejects.toThrow('Upload failed');
      expect(r2Service.deleteFile).toHaveBeenCalled();
    });

    it('should upload png photo successfully', async () => {
      const pngFile = { ...validFile, mimetype: 'image/png', originalname: 'photo.png' };
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/photo.png',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/photo.png');

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, pngFile);

      expect(result.id).toBe('user-123');
    });

    it('should upload webp photo successfully', async () => {
      const webpFile = { ...validFile, mimetype: 'image/webp', originalname: 'photo.webp' };
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/photo.webp',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/photo.webp');

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, webpFile);

      expect(result.id).toBe('user-123');
    });

    it('should upload image/jpg photo successfully', async () => {
      const jpgFile = { ...validFile, mimetype: 'image/jpg', originalname: 'photo.jpg' };
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/photo.jpg');

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, jpgFile);

      expect(result.id).toBe('user-123');
    });

    it('should handle deletePhotoSafely error gracefully when deleting old photo', async () => {
      const userWithOldPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/old-photo.jpg',
      };
      const userWithNewPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/new-photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithOldPhoto as any)
        .mockResolvedValueOnce(userWithNewPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.deleteFile.mockRejectedValue(new Error('Delete failed'));
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/new-url');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const req = makeRequest('user-123');
      const result = await controller.uploadMyPhoto(req, validFile);

      // Error in delete old photo should not propagate
      expect(result.id).toBe('user-123');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ─── deleteMyPhoto ─────────────────────────────────────────────────────────

  describe('deleteMyPhoto', () => {
    it('should delete photo and return updated profile', async () => {
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/photo.jpg',
      };
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithPhoto as any)
        .mockResolvedValueOnce(userWithNoPhoto as any);

      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.deleteFile.mockResolvedValue(undefined);

      const req = makeRequest('user-123');
      const result = await controller.deleteMyPhoto(req);

      expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-123', { photoR2Key: '' });
      expect(r2Service.deleteFile).toHaveBeenCalledWith('users/user-123/photo.jpg');
      expect(result.id).toBe('user-123');
    });

    it('should delete photo without R2 cleanup when no photo exists', async () => {
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };

      getMyProfileUseCase.execute.mockResolvedValue(userWithNoPhoto as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);

      const req = makeRequest('user-123');
      const result = await controller.deleteMyPhoto(req);

      expect(r2Service.deleteFile).not.toHaveBeenCalled();
      expect(result.id).toBe('user-123');
    });

    it('should handle R2 delete error gracefully', async () => {
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/photo.jpg',
      };
      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithPhoto as any)
        .mockResolvedValueOnce(userWithNoPhoto as any);

      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.deleteFile.mockRejectedValue(new Error('R2 error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const req = makeRequest('user-123');
      const result = await controller.deleteMyPhoto(req);

      expect(result.id).toBe('user-123');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ─── deleteMe ──────────────────────────────────────────────────────────────

  describe('deleteMe', () => {
    it('should delete user account and clear cookie', async () => {
      userService.deleteAccount.mockResolvedValue(undefined);

      const req = makeRequest('user-123') as any;
      const res = makeResponse();

      await controller.deleteMe(req, res);

      expect(userService.deleteAccount).toHaveBeenCalledWith('user-123');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
    });

    it('should throw UnauthorizedException when userId is missing', async () => {
      const req = { user: { userId: null } } as any;
      const res = makeResponse();

      await expect(controller.deleteMe(req, res)).rejects.toThrow(UnauthorizedException);
      await expect(controller.deleteMe(req, res)).rejects.toThrow('User ID not found');
    });
  });

  // ─── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      userService.updateUserProfile.mockResolvedValue(mockUserProfile as any);

      const req = makeRequest('user-123');
      const dto = { firstName: 'Jane', lastName: 'Smith' };

      const result = await controller.updateProfile(req, dto);

      expect(userService.updateUserProfile).toHaveBeenCalledWith('user-123', dto);
      expect(result).toBe(mockUserProfile);
    });
  });

  // ─── getPreferences ────────────────────────────────────────────────────────

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      getMyPreferencesUseCase.execute.mockResolvedValue(mockPreferences as any);

      const req = makeRequest('user-123') as any;
      const result = await controller.getPreferences(req);

      expect(getMyPreferencesUseCase.execute).toHaveBeenCalledWith('user-123');
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
    });
  });

  // ─── updatePreferences ─────────────────────────────────────────────────────

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updatedPrefs = { ...mockPreferences, theme: 'light' };
      updateUserPreferencesUseCase.execute.mockResolvedValue(updatedPrefs as any);

      const req = makeRequest('user-123') as any;
      const dto = { theme: 'light' as const, notificationEmail: true };

      const result = await controller.updatePreferences(req, dto);

      expect(updateUserPreferencesUseCase.execute).toHaveBeenCalledWith('user-123', {
        theme: 'light',
        notificationEmail: true,
        notificationPush: undefined,
        notificationSms: undefined,
        defaultReminderDelay: undefined,
        currency: undefined,
        showOnlineStatus: undefined,
      });
      expect(result).toBeDefined();
    });
  });

  // ─── exportData ────────────────────────────────────────────────────────────

  describe('exportData', () => {
    it('should create export request with req.ip', async () => {
      rgpdExportService.createExportRequest.mockResolvedValue(mockExportResponse);

      const req = { ...makeRequest('user-123'), ip: '10.0.0.1' } as any;
      const dto = { format: 'json' as const };

      const result = await controller.exportData(req, dto);

      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'json' },
        '10.0.0.1',
      );
      expect(result).toBe(mockExportResponse);
    });

    it('should create export request using socket.remoteAddress when ip is missing', async () => {
      rgpdExportService.createExportRequest.mockResolvedValue(mockExportResponse);

      const req = {
        user: { userId: 'user-123', role: Role.USER_PREMIUM },
        ip: undefined,
        socket: { remoteAddress: '192.168.5.5' },
      } as any;
      const dto = { format: 'csv' as const };

      const result = await controller.exportData(req, dto);

      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'csv' },
        '192.168.5.5',
      );
      expect(result).toBe(mockExportResponse);
    });

    it('should fallback to unknown when no ip and no socket address', async () => {
      rgpdExportService.createExportRequest.mockResolvedValue(mockExportResponse);

      const req = {
        user: { userId: 'user-123' },
        ip: undefined,
        socket: { remoteAddress: undefined },
      } as any;
      const dto = { format: 'json' as const };

      await controller.exportData(req, dto);

      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'json' },
        'unknown',
      );
    });
  });

  // ─── Private method coverage via edge cases ───────────────────────────────

  describe('extractUserIdFromRequest (via getProfile)', () => {
    it('should throw UnauthorizedException when user is undefined in request', async () => {
      const req = {} as Request;

      await expect(controller.getProfile(req)).rejects.toThrow(UnauthorizedException);
      await expect(controller.getProfile(req)).rejects.toThrow('Invalid or missing JWT token');
    });

    it('should throw UnauthorizedException when userId is empty', async () => {
      const req = { user: { userId: '' } } as unknown as Request;

      await expect(controller.getProfile(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resolveImageExtension (private method coverage)', () => {
    it('should return .jpg as fallback for unknown mime types', () => {
      // Access private method via bracket notation
      const ext = (controller as any).resolveImageExtension('application/octet-stream');
      expect(ext).toBe('.jpg');
    });

    it('should return .png for image/png', () => {
      const ext = (controller as any).resolveImageExtension('image/png');
      expect(ext).toBe('.png');
    });

    it('should return .webp for image/webp', () => {
      const ext = (controller as any).resolveImageExtension('image/webp');
      expect(ext).toBe('.webp');
    });

    it('should return .jpg for image/jpeg', () => {
      const ext = (controller as any).resolveImageExtension('image/jpeg');
      expect(ext).toBe('.jpg');
    });

    it('should return .jpg for image/jpg', () => {
      const ext = (controller as any).resolveImageExtension('image/jpg');
      expect(ext).toBe('.jpg');
    });
  });

  describe('sanitizeFilename edge cases (via uploadMyPhoto)', () => {
    it('should sanitize special characters from filename', async () => {
      const fileWithSpecialName = {
        fieldname: 'file',
        originalname: 'My Profile!! Photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
        size: 512,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/my-profile--photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/url');

      const req = makeRequest('user-123');
      await controller.uploadMyPhoto(req, fileWithSpecialName);

      const uploadCall = r2Service.uploadFile.mock.calls[0];
      const r2Key = uploadCall[1];
      // The key should be sanitized (no special chars)
      expect(r2Key).toMatch(/^users\/user-123\/profile-photo\//);
    });

    it('should use "profile-photo" fallback for empty sanitized filename', async () => {
      const fileWithNoName = {
        fieldname: 'file',
        originalname: '',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
        size: 512,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const userWithNoPhoto = { ...mockUserEntity, photoR2Key: null };
      const userWithPhoto = {
        ...mockUserEntity,
        photoR2Key: 'users/user-123/profile-photo/profile-photo.jpg',
      };

      getMyProfileUseCase.execute
        .mockResolvedValueOnce(userWithNoPhoto as any)
        .mockResolvedValueOnce(userWithPhoto as any);

      r2Service.uploadFile.mockResolvedValue(undefined as any);
      updateMyProfileUseCase.execute.mockResolvedValue(undefined);
      r2Service.getSignedUrl.mockResolvedValue('https://cdn.example.com/url');

      const req = makeRequest('user-123');
      await controller.uploadMyPhoto(req, fileWithNoName);

      const uploadCall = r2Service.uploadFile.mock.calls[0];
      const r2Key = uploadCall[1];
      expect(r2Key).toContain('profile-photo');
    });
  });
});
