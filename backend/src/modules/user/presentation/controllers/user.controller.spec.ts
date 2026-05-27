import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserController } from './user.controller';
const TEST_IP = 'test-ip-address';

describe('UserController', () => {
  let controller: UserController;
  let userService: any;
  let userPreferencesService: any;
  let getMyProfileUseCase: any;
  let updateMyProfileUseCase: any;
  let getMyPreferencesUseCase: any;
  let updateUserPreferencesUseCase: any;
  let requestRgpdExportUseCase: any;
  let rgpdExportService: any;
  let r2Service: any;

  const profile = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    photoR2Key: null,
    role_key: 'USER_FREEMIUM',
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    userService = {
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      deleteAccount: jest.fn(),
    };
    userPreferencesService = {};
    getMyProfileUseCase = { execute: jest.fn() };
    updateMyProfileUseCase = { execute: jest.fn() };
    getMyPreferencesUseCase = { execute: jest.fn() };
    updateUserPreferencesUseCase = { execute: jest.fn() };
    requestRgpdExportUseCase = { execute: jest.fn() };
    rgpdExportService = { createExportRequest: jest.fn() };
    r2Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    controller = new UserController(
      userService,
      userPreferencesService,
      getMyProfileUseCase,
      updateMyProfileUseCase,
      getMyPreferencesUseCase,
      updateUserPreferencesUseCase,
      requestRgpdExportUseCase,
      rgpdExportService,
      r2Service,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('getProfile extracts the user id from the request', async () => {
    userService.getUserProfile.mockResolvedValue(profile);

    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;

    await expect(controller.getProfile(req)).resolves.toBe(profile);
    expect(userService.getUserProfile).toHaveBeenCalledWith('user-1');
  });

  it('throws when extracting user id from an unauthenticated request', () => {
    expect(() => (controller as any).extractUserIdFromRequest({})).toThrow(UnauthorizedException);
  });

  it('returns the base response when the user has no profile photo', async () => {
    await expect((controller as any).toUserMeResponse(profile)).resolves.toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
        photoR2Key: undefined,
      }),
    );
    expect(r2Service.getSignedUrl).not.toHaveBeenCalled();
  });

  it('adds a signed photo url when the profile has a photo', async () => {
    r2Service.getSignedUrl.mockResolvedValue('https://signed.example/photo');

    const result = await (controller as any).toUserMeResponse({
      ...profile,
      photoR2Key: 'users/user-1/photo.jpg',
    });

    expect(r2Service.getSignedUrl).toHaveBeenCalledWith('users/user-1/photo.jpg', 86400);
    expect(result.photoUrl).toBe('https://signed.example/photo');
  });

  it('swallows signed url generation failures and still returns the response', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    r2Service.getSignedUrl.mockRejectedValue(new Error('R2 down'));

    const result = await (controller as any).toUserMeResponse({
      ...profile,
      photoR2Key: 'users/user-1/photo.jpg',
    });

    expect(result.photoUrl).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('sanitizes filenames and falls back when nothing remains', () => {
    expect((controller as any).sanitizeFilename('My Pretty Photo!!.png')).toBe('my-pretty-photo');
    expect((controller as any).sanitizeFilename('@@@.png')).toBe('profile-photo');
  });

  it('resolves image extensions from mime types', () => {
    expect((controller as any).resolveImageExtension('image/png')).toBe('.png');
    expect((controller as any).resolveImageExtension('image/webp')).toBe('.webp');
    expect((controller as any).resolveImageExtension('image/jpeg')).toBe('.jpg');
    expect((controller as any).resolveImageExtension('image/jpg')).toBe('.jpg');
    expect((controller as any).resolveImageExtension('application/octet-stream')).toBe('.jpg');
  });

  it('deletePhotoSafely swallows storage deletion errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    r2Service.deleteFile.mockRejectedValue(new Error('delete failed'));

    await expect(
      (controller as any).deletePhotoSafely('users/user-1/photo.jpg'),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('rejects photo upload when file is missing', async () => {
    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;

    await expect(controller.uploadMyPhoto(req, undefined as any)).rejects.toThrow(
      new BadRequestException('File is required'),
    );
  });

  it('rejects photo upload when file is empty', async () => {
    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;
    const file = { size: 0 } as Express.Multer.File;

    await expect(controller.uploadMyPhoto(req, file)).rejects.toThrow(
      new BadRequestException('File is empty'),
    );
  });

  it('rejects photo upload when file is too large', async () => {
    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;
    const file = { size: 6 * 1024 * 1024 } as Express.Multer.File;

    await expect(controller.uploadMyPhoto(req, file)).rejects.toThrow(
      'Profile photo size exceeds 5MB limit',
    );
  });

  it('rejects photo upload when mime type is not supported', async () => {
    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;
    const file = {
      size: 128,
      mimetype: 'application/pdf',
      originalname: 'cv.pdf',
    } as Express.Multer.File;

    await expect(controller.uploadMyPhoto(req, file)).rejects.toThrow(
      'Unsupported image type. Allowed: JPEG, PNG, WEBP',
    );
  });

  it('uploads a new photo, updates the profile, and removes the previous photo', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1735689600000);
    getMyProfileUseCase.execute
      .mockResolvedValueOnce({ ...profile, photoR2Key: 'users/user-1/old.jpg' })
      .mockResolvedValueOnce({
        ...profile,
        photoR2Key: 'users/user-1/profile-photo/1735689600000-my-avatar.png',
      });
    r2Service.getSignedUrl.mockResolvedValue('https://signed.example/new');

    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;
    const file = {
      size: 1024,
      mimetype: 'image/png',
      originalname: 'My Avatar.png',
      buffer: Buffer.from('img'),
    } as Express.Multer.File;

    const result = await controller.uploadMyPhoto(req, file);

    expect(r2Service.uploadFile).toHaveBeenCalledWith(
      file.buffer,
      'users/user-1/profile-photo/1735689600000-my-avatar.png',
      'image/png',
    );
    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-1', {
      photoR2Key: 'users/user-1/profile-photo/1735689600000-my-avatar.png',
    });
    expect(r2Service.deleteFile).toHaveBeenCalledWith('users/user-1/old.jpg');
    expect(result.photoUrl).toBe('https://signed.example/new');
  });

  it('cleans up the freshly uploaded photo if profile update fails', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1735689600000);
    getMyProfileUseCase.execute.mockResolvedValue({ ...profile, photoR2Key: null });
    updateMyProfileUseCase.execute.mockRejectedValue(new Error('update failed'));

    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as unknown as Request;
    const file = {
      size: 1024,
      mimetype: 'image/jpeg',
      originalname: 'Avatar.jpg',
      buffer: Buffer.from('img'),
    } as Express.Multer.File;

    await expect(controller.uploadMyPhoto(req, file)).rejects.toThrow('update failed');
    expect(r2Service.deleteFile).toHaveBeenCalledWith(
      'users/user-1/profile-photo/1735689600000-avatar.jpg',
    );
  });

  it('deletes the current photo and clears the refresh token on account deletion', async () => {
    getMyProfileUseCase.execute
      .mockResolvedValueOnce({ ...profile, photoR2Key: 'users/user-1/old.jpg' })
      .mockResolvedValueOnce({ ...profile, photoR2Key: null });
    const req = { user: { userId: 'user-1', role: 'USER_FREEMIUM' } } as any;
    const res = { clearCookie: jest.fn() } as unknown as Response;

    await controller.deleteMe(req, res);
    expect(userService.deleteAccount).toHaveBeenCalledWith('user-1');
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });

    const photoResult = await controller.deleteMyPhoto(req);
    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-1', { photoR2Key: '' });
    expect(r2Service.deleteFile).toHaveBeenCalledWith('users/user-1/old.jpg');
    expect(photoResult.photoUrl).toBeUndefined();
  });

  it('throws on deleteMe when request does not contain a user id', async () => {
    await expect(
      controller.deleteMe({ user: {} } as any, { clearCookie: jest.fn() } as any),
    ).rejects.toThrow('User ID not found');
  });

  it('delegates exportData to the RGPD service and resolves ip fallback', async () => {
    rgpdExportService.createExportRequest.mockResolvedValue({ id: 'export-1' });

    const req = {
      user: { userId: 'user-1' },
      socket: { remoteAddress: TEST_IP },
    } as any;

    await expect(controller.exportData(req, { format: 'csv' } as any)).resolves.toEqual({
      id: 'export-1',
    });
    expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
      'user-1',
      { format: 'csv' },
      TEST_IP,
    );
  });

  it('returns preferences through the response DTO factory', async () => {
    const prefs = {
      userId: 'user-1',
      notificationEmail: true,
      notificationPush: false,
      notificationSms: false,
      theme: 'light',
      currency: 'EUR',
      defaultReminderDelay: 10,
      showOnlineStatus: true,
    };

    getMyPreferencesUseCase.execute.mockResolvedValue(prefs);

    await expect(controller.getPreferences({ user: { userId: 'user-1' } } as any)).resolves.toEqual(
      expect.objectContaining({ userId: 'user-1' }),
    );

    expect(getMyPreferencesUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('maps updatePreferences through UserPreferencesMapper before delegating', async () => {
    const dto = {
      notificationEmail: false,
      notificationPush: true,
      notificationSms: false,
      theme: 'dark',
      language: 'en',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      defaultReminderDelay: 15,
      showOnlineStatus: true,
    };

    updateUserPreferencesUseCase.execute.mockResolvedValue({
      userId: 'user-1',
      notificationEmail: false,
      notificationPush: true,
      notificationSms: false,
      theme: 'dark',
      currency: 'EUR',
      defaultReminderDelay: 15,
      showOnlineStatus: true,
    });

    await expect(
      controller.updatePreferences({ user: { userId: 'user-1' } } as any, dto as any),
    ).resolves.toEqual(expect.objectContaining({ userId: 'user-1' }));

    expect(updateUserPreferencesUseCase.execute).toHaveBeenCalledWith('user-1', {
      notificationEmail: false,
      notificationPush: true,
      notificationSms: false,
      theme: 'dark',
      currency: 'EUR',
      defaultReminderDelay: 15,
      showOnlineStatus: true,
    });
  });

  it('uses req.ip first when exporting data', async () => {
    rgpdExportService.createExportRequest.mockResolvedValue({ id: 'export-ip' });

    const req = {
      ip: '203.0.113.10',
      socket: { remoteAddress: TEST_IP },
      user: { userId: 'user-1' },
    } as any;

    await controller.exportData(req, { format: 'json' } as any);

    expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
      'user-1',
      { format: 'json' },
      '203.0.113.10',
    );
  });

  it('getMe returns the mobile contract response', async () => {
    getMyProfileUseCase.execute.mockResolvedValue({
      ...profile,
      photoR2Key: null,
    });

    const req = {
      user: { userId: 'user-1', role: 'USER_FREEMIUM' },
    } as any;

    const result = await controller.getMe(req);

    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.com',
      }),
    );
  });

  it('updateMe updates then reloads and returns the mobile response', async () => {
    const req = {
      user: { userId: 'user-1', role: 'USER_FREEMIUM' },
    } as any;

    const dto = {
      firstName: 'Jane',
      lastName: 'Doe',
    };

    getMyProfileUseCase.execute.mockResolvedValue({
      ...profile,
      firstName: 'Jane',
    });

    const result = await controller.updateMe(req, dto as any);

    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-1', dto);
    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        firstName: 'Jane',
      }),
    );
  });

  it('updateProfile delegates to userService with extracted user id', async () => {
    userService.updateUserProfile.mockResolvedValue({
      ...profile,
      firstName: 'Updated',
    });

    const req = {
      user: { userId: 'user-1', role: 'USER_FREEMIUM' },
    } as any;

    const dto = {
      firstName: 'Updated',
    };

    const result = await controller.updateProfile(req, dto as any);

    expect(userService.updateUserProfile).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual(
      expect.objectContaining({
        firstName: 'Updated',
      }),
    );
  });

  it('updateProfile throws when request has no authenticated user', async () => {
    await expect(controller.updateProfile({} as any, {} as any)).rejects.toThrow(
      new UnauthorizedException('Invalid or missing JWT token'),
    );
  });
});
