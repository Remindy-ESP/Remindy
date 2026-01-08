import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../../domain/services/user.service';
import { UserPreferencesService } from '../../domain/services/user-preferences.service';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { DeleteMyAccountUseCase } from '../../application/use-cases/delete-my-account.use-case';
import { GetMyPreferencesUseCase } from '../../application/use-cases/get-my-preferences.use-case';
import { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import { RequestRgpdExportUseCase } from '../../application/use-cases/request-rgpd-export.use-case';
import { RgpdExportService } from '../../application/services/rgpd-export.service';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import type { RequestWithUser } from 'src/types/request-with-user.interface';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let userPreferencesService: jest.Mocked<UserPreferencesService>;
  let getMyProfileUseCase: jest.Mocked<GetMyProfileUseCase>;
  let updateMyProfileUseCase: jest.Mocked<UpdateMyProfileUseCase>;
  let deleteMyAccountUseCase: jest.Mocked<DeleteMyAccountUseCase>;
  let getMyPreferencesUseCase: jest.Mocked<GetMyPreferencesUseCase>;
  let updateUserPreferencesUseCase: jest.Mocked<UpdateUserPreferencesUseCase>;
  let requestRgpdExportUseCase: jest.Mocked<RequestRgpdExportUseCase>;
  let rgpdExportService: jest.Mocked<RgpdExportService>;

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

    const mockDeleteMyAccountUseCase = {
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: UserPreferencesService, useValue: mockUserPreferencesService },
        { provide: GetMyProfileUseCase, useValue: mockGetMyProfileUseCase },
        { provide: UpdateMyProfileUseCase, useValue: mockUpdateMyProfileUseCase },
        { provide: DeleteMyAccountUseCase, useValue: mockDeleteMyAccountUseCase },
        { provide: GetMyPreferencesUseCase, useValue: mockGetMyPreferencesUseCase },
        { provide: UpdateUserPreferencesUseCase, useValue: mockUpdateUserPreferencesUseCase },
        { provide: RequestRgpdExportUseCase, useValue: mockRequestRgpdExportUseCase },
        { provide: RgpdExportService, useValue: mockRgpdExportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    userPreferencesService = module.get(UserPreferencesService);
    getMyProfileUseCase = module.get(GetMyProfileUseCase);
    updateMyProfileUseCase = module.get(UpdateMyProfileUseCase);
    deleteMyAccountUseCase = module.get(DeleteMyAccountUseCase);
    getMyPreferencesUseCase = module.get(GetMyPreferencesUseCase);
    updateUserPreferencesUseCase = module.get(UpdateUserPreferencesUseCase);
    requestRgpdExportUseCase = module.get(RequestRgpdExportUseCase);
    rgpdExportService = module.get(RgpdExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      userService.getUserProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(userService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user not in request', async () => {
      const mockRequest = {} as any;

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(UnauthorizedException);
      await expect(controller.getProfile(mockRequest)).rejects.toThrow('Invalid or missing JWT token');
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      getMyProfileUseCase.execute.mockResolvedValue(mockProfile as any);

      const result = await controller.getMe(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      const updateDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      updateMyProfileUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.updateMe(mockRequest, updateDto as any);

      expect(result).toEqual({ success: true });
      expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-123', updateDto);
    });
  });

  describe('deleteMe', () => {
    it('should delete user account and clear refresh token cookie', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
      } as any;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      deleteMyAccountUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteMe(mockRequest, mockResponse);

      expect(result).toEqual({ success: true });
      expect(deleteMyAccountUseCase.execute).toHaveBeenCalledWith('user-123');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
    });

    it('should throw UnauthorizedException when userId not found', async () => {
      const mockRequest = {
        user: { userId: null },
      } as any;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      await expect(controller.deleteMe(mockRequest, mockResponse)).rejects.toThrow(UnauthorizedException);
      await expect(controller.deleteMe(mockRequest, mockResponse)).rejects.toThrow('User ID not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      const updateDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const mockUpdatedProfile = {
        id: 'user-123',
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      userService.updateUserProfile.mockResolvedValue(mockUpdatedProfile as any);

      const result = await controller.updateProfile(mockRequest, updateDto as any);

      expect(result).toEqual(mockUpdatedProfile);
      expect(userService.updateUserProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should throw UnauthorizedException when user not in request', async () => {
      const mockRequest = {} as any;
      const updateDto = { name: 'Test' };

      await expect(controller.updateProfile(mockRequest, updateDto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
      } as RequestWithUser;

      const mockPreferences = {
        id: 'pref-123',
        userId: 'user-123',
        language: 'en',
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: false,
      };

      getMyPreferencesUseCase.execute.mockResolvedValue(mockPreferences as any);

      const result = await controller.getPreferences(mockRequest);

      expect(result).toBeDefined();
      expect(getMyPreferencesUseCase.execute).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
      } as RequestWithUser;

      const updateDto = {
        language: 'fr',
        theme: 'light',
        emailNotifications: false,
      };

      const mockUpdatedPreferences = {
        id: 'pref-123',
        userId: 'user-123',
        language: 'fr',
        theme: 'light',
        emailNotifications: false,
      };

      updateUserPreferencesUseCase.execute.mockResolvedValue(mockUpdatedPreferences as any);

      const result = await controller.updatePreferences(mockRequest, updateDto as any);

      expect(result).toBeDefined();
      expect(updateUserPreferencesUseCase.execute).toHaveBeenCalledWith('user-123', expect.anything());
    });
  });

  describe('exportData', () => {
    it('should create RGPD export request', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
        ip: '192.168.1.1',
      } as any;

      const exportDto = {
        format: 'json' as const,
      };

      const mockExportResponse = {
        id: 'export-123',
        userId: 'user-123',
        status: 'pending',
        format: 'json',
      };

      rgpdExportService.createExportRequest.mockResolvedValue(mockExportResponse as any);

      const result = await controller.exportData(mockRequest, exportDto);

      expect(result).toEqual(mockExportResponse);
      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'json' },
        '192.168.1.1',
      );
    });

    it('should use socket remoteAddress when ip not available', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
      } as any;

      const exportDto = {
        format: 'csv' as const,
      };

      rgpdExportService.createExportRequest.mockResolvedValue({} as any);

      await controller.exportData(mockRequest, exportDto);

      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'csv' },
        '10.0.0.1',
      );
    });

    it('should use unknown when no IP available', async () => {
      const mockRequest = {
        user: { userId: 'user-123' },
        ip: undefined,
        socket: {},
      } as any;

      const exportDto = {
        format: 'json' as const,
      };

      rgpdExportService.createExportRequest.mockResolvedValue({} as any);

      await controller.exportData(mockRequest, exportDto);

      expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
        'user-123',
        { format: 'json' },
        'unknown',
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      userService.deleteAccount.mockResolvedValue(undefined);

      await controller.deleteAccount(mockRequest);

      expect(userService.deleteAccount).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user not in request', async () => {
      const mockRequest = {} as any;

      await expect(controller.deleteAccount(mockRequest)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('extractUserIdFromRequest', () => {
    it('should extract userId from request with valid user', async () => {
      const mockRequest = {
        user: { userId: 'user-123', role: 'user' },
      } as any;

      // Call a method that uses extractUserIdFromRequest
      userService.getUserProfile.mockResolvedValue({} as any);
      await controller.getProfile(mockRequest);

      expect(userService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user is missing', async () => {
      const mockRequest = {} as any;

      userService.getUserProfile.mockResolvedValue({} as any);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(UnauthorizedException);
      await expect(controller.getProfile(mockRequest)).rejects.toThrow('Invalid or missing JWT token');
    });

    it('should throw UnauthorizedException when userId is missing', async () => {
      const mockRequest = {
        user: { role: 'user' },
      } as any;

      userService.getUserProfile.mockResolvedValue({} as any);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(UnauthorizedException);
    });
  });
});
