import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ExpoPushService, EXPO_INSTANCE, EXPO_CLASS } from './expo-push.service';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

describe('ExpoPushService', () => {
  let service: ExpoPushService;
  let userRepository: any;
  let expoInstance: any;
  let ExpoClass: any;

  const mockUserId = 'user-123';
  const mockToken = 'ExponentPushToken[mock-token-123]';

  beforeEach(async () => {
    userRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    expoInstance = {
      chunkPushNotifications: jest.fn(),
      sendPushNotificationsAsync: jest.fn(),
    };

    ExpoClass = {
      isExpoPushToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpoPushService,
        {
          provide: getRepositoryToken(EUser),
          useValue: userRepository,
        },
        { provide: EXPO_INSTANCE, useValue: expoInstance },
        { provide: EXPO_CLASS, useValue: ExpoClass },
      ],
    }).compile();

    service = module.get<ExpoPushService>(ExpoPushService);

    jest.spyOn(service['logger'], 'warn').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should register a valid token', async () => {
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      await service.registerToken(mockUserId, mockToken);

      expect(ExpoClass.isExpoPushToken).toHaveBeenCalledWith(mockToken);
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: mockToken });
    });

    it('should throw BadRequestException for invalid token', async () => {
      ExpoClass.isExpoPushToken.mockReturnValue(false);

      await expect(service.registerToken(mockUserId, 'invalid-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('unregisterToken', () => {
    it('should unregister a token by setting it to null', async () => {
      await service.unregisterToken(mockUserId);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: null });
    });
  });

  describe('sendToUser', () => {
    const payload = {
      userId: mockUserId,
      title: 'Test Title',
      body: 'Test Body',
    };

    it('should return false if user has no token', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: null });

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should return false if stored token is invalid', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: 'invalid' });
      ExpoClass.isExpoPushToken.mockReturnValue(false);

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should send notification and return true for valid token', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: mockToken });
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      const mockMessage = {
        to: mockToken,
        title: payload.title,
        body: payload.body,
        sound: 'default',
        data: {},
      };
      expoInstance.chunkPushNotifications.mockReturnValue([[mockMessage]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await service.sendToUser(payload);

      expect(result).toBe(true);
      expect(expoInstance.chunkPushNotifications).toHaveBeenCalled();
      expect(expoInstance.sendPushNotificationsAsync).toHaveBeenCalled();
    });

    it('should unregister token if DeviceNotRegistered error occurs', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: mockToken });
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([
        { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } },
      ]);

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: null });
    });

    it('should return false if sendPushNotificationsAsync throws', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: mockToken });
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockRejectedValue(new Error('Network error'));

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
    });
  });

  describe('sendToUsers', () => {
    const payloads = [
      { userId: 'user-1', title: 'Title 1', body: 'Body 1' },
      { userId: 'user-2', title: 'Title 2', body: 'Body 2' },
    ];

    it('should filter out users with no valid token and send batch', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'user-1', expoPushToken: mockToken }]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb);
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await service.sendToUsers(payloads);

      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return all false and skip send when no users have tokens', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb);
      ExpoClass.isExpoPushToken.mockReturnValue(false);

      const result = await service.sendToUsers(payloads);

      expect(result.get('user-1')).toBe(false);
      expect(result.get('user-2')).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should unregister token on DeviceNotRegistered in batch', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'user-1', expoPushToken: mockToken }]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb);
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([
        { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } },
      ]);

      const result = await service.sendToUsers([payloads[0]]);

      expect(result.get('user-1')).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith('user-1', { expoPushToken: null });
    });

    it('should handle chunk send failure and mark affected users as failed', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'user-1', expoPushToken: mockToken }]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb);
      ExpoClass.isExpoPushToken.mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockRejectedValue(new Error('chunk failed'));

      const result = await service.sendToUsers([payloads[0]]);

      expect(result.get('user-1')).toBe(false);
    });
  });
});
