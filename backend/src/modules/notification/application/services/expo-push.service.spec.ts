import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ExpoPushService } from './expo-push.service';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { Expo } from 'expo-server-sdk';

describe('ExpoPushService', () => {
  let service: ExpoPushService;
  let userRepository: any;
  let expoInstance: any;

  const mockUserId = 'user-123';
  const mockToken = 'ExponentPushToken[mock-token-123]';

  beforeEach(async () => {
    userRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpoPushService,
        {
          provide: getRepositoryToken(EUser),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<ExpoPushService>(ExpoPushService);
    // Access the mocked expo instance
    expoInstance = (service as any).expo;

    jest.spyOn(service['logger'], 'warn').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();
    jest.spyOn(service['logger'], 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should register a valid token', async () => {
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(true);

      await service.registerToken(mockUserId, mockToken);

      expect(Expo.isExpoPushToken).toHaveBeenCalledWith(mockToken);
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: mockToken });
    });

    it('should throw BadRequestException for invalid token', async () => {
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(false);

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
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(false);

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should send notification and return true for valid token', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: mockToken });
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(true);

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
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(true);

      const mockMessage = {
        to: mockToken,
        title: payload.title,
        body: payload.body,
        sound: 'default',
        data: {},
      };
      expoInstance.chunkPushNotifications.mockReturnValue([[mockMessage]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([
        { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } },
      ]);

      const result = await service.sendToUser(payload);

      expect(result).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: null });
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
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', expoPushToken: mockToken },
          // user-2 not returned (no token)
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb);
      (Expo.isExpoPushToken as jest.Mock).mockReturnValue(true);

      expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await service.sendToUsers(payloads);

      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(false); // No token
      expect(expoInstance.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    });
  });
});
