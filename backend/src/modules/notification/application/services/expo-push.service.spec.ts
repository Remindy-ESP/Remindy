import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ExpoPushService, EXPO_INSTANCE, EXPO_CLASS } from './expo-push.service';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

const mockUserId = 'user-123';
const mockToken = 'ExponentPushToken[mock-token-123]';

const basePayload = { userId: mockUserId, title: 'Test Title', body: 'Test Body' };

const batchPayloads = [
  { userId: 'user-1', title: 'Title 1', body: 'Body 1' },
  { userId: 'user-2', title: 'Title 2', body: 'Body 2' },
];

function makeQbMock(users: Partial<EUser>[]) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(users),
  };
}

function mockValidTokenForBatch(userRepository: any, ExpoClass: any, expoInstance: any) {
  userRepository.createQueryBuilder.mockReturnValue(
    makeQbMock([{ id: 'user-1', expoPushToken: mockToken }]),
  );
  ExpoClass.isExpoPushToken.mockReturnValue(true);
  expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
}

function mockValidTokenForSingle(userRepository: any, ExpoClass: any, expoInstance: any) {
  userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: mockToken });
  ExpoClass.isExpoPushToken.mockReturnValue(true);
  expoInstance.chunkPushNotifications.mockReturnValue([[{ to: mockToken }]]);
}

describe('ExpoPushService', () => {
  let service: ExpoPushService;
  let userRepository: any;
  let expoInstance: any;
  let ExpoClass: any;

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

    ExpoClass = { isExpoPushToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpoPushService,
        { provide: getRepositoryToken(EUser), useValue: userRepository },
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
    it('should return false if user has no token', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: null });

      const result = await service.sendToUser(basePayload);

      expect(result).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should return false if stored token is invalid', async () => {
      userRepository.findOne.mockResolvedValue({ id: mockUserId, expoPushToken: 'invalid' });
      ExpoClass.isExpoPushToken.mockReturnValue(false);

      const result = await service.sendToUser(basePayload);

      expect(result).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should send notification and return true for valid token', async () => {
      mockValidTokenForSingle(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await service.sendToUser(basePayload);

      expect(result).toBe(true);
      expect(expoInstance.chunkPushNotifications).toHaveBeenCalled();
      expect(expoInstance.sendPushNotificationsAsync).toHaveBeenCalled();
    });

    it('should unregister token if DeviceNotRegistered error occurs', async () => {
      mockValidTokenForSingle(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([
        { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } },
      ]);

      const result = await service.sendToUser(basePayload);

      expect(result).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { expoPushToken: null });
    });

    it('should return false if sendPushNotificationsAsync throws', async () => {
      mockValidTokenForSingle(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockRejectedValue(new Error('Network error'));

      const result = await service.sendToUser(basePayload);

      expect(result).toBe(false);
    });
  });

  describe('sendToUsers', () => {
    it('should filter out users with no valid token and send batch', async () => {
      mockValidTokenForBatch(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

      const result = await service.sendToUsers(batchPayloads);

      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return all false and skip send when no users have tokens', async () => {
      userRepository.createQueryBuilder.mockReturnValue(makeQbMock([]));
      ExpoClass.isExpoPushToken.mockReturnValue(false);

      const result = await service.sendToUsers(batchPayloads);

      expect(result.get('user-1')).toBe(false);
      expect(result.get('user-2')).toBe(false);
      expect(expoInstance.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should unregister token on DeviceNotRegistered in batch', async () => {
      mockValidTokenForBatch(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([
        { status: 'error', message: 'Not registered', details: { error: 'DeviceNotRegistered' } },
      ]);

      const result = await service.sendToUsers([batchPayloads[0]]);

      expect(result.get('user-1')).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith('user-1', { expoPushToken: null });
    });

    it('should handle chunk send failure and mark affected users as failed', async () => {
      mockValidTokenForBatch(userRepository, ExpoClass, expoInstance);
      expoInstance.sendPushNotificationsAsync.mockRejectedValue(new Error('chunk failed'));

      const result = await service.sendToUsers([batchPayloads[0]]);

      expect(result.get('user-1')).toBe(false);
    });
  });
});
