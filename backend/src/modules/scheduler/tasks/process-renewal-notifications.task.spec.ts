import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ProcessRenewalNotificationsTask } from './process-renewal-notifications.task';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { NOTIFICATION_REPOSITORY } from '../../notification/application/ports/notification-repository.interface';
import { ExpoPushService } from '../../notification/application/services/expo-push.service';

describe('ProcessRenewalNotificationsTask', () => {
  let task: ProcessRenewalNotificationsTask;
  let subscriptionRepository: any;
  let notificationRepository: any;
  let expoPushService: any;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    subscriptionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    notificationRepository = {
      save: jest.fn(),
    };

    expoPushService = {
      sendToUsers: jest.fn().mockResolvedValue(new Map()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessRenewalNotificationsTask,
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: subscriptionRepository,
        },
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: notificationRepository,
        },
        {
          provide: ExpoPushService,
          useValue: expoPushService,
        },
      ],
    }).compile();

    task = module.get<ProcessRenewalNotificationsTask>(ProcessRenewalNotificationsTask);

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCron', () => {
    it('should query both renewal and trial ending notifications and log if 0 found', async () => {
      await task.handleCron();

      // createQueryBuilder is called twice: once for renewals, once for trial endings
      expect(subscriptionRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith('Found 0 renewal notification(s) to create');
      expect(loggerSpy).toHaveBeenCalledWith('Found 0 trial ending notification(s) to create');
      expect(notificationRepository.save).not.toHaveBeenCalled();
      expect(expoPushService.sendToUsers).not.toHaveBeenCalled();
    });

    it('should create renewal notifications and queue push', async () => {
      const mockRenewalRow = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Netflix',
        subscriptionAmount: 15.99,
        subscriptionCurrency: 'EUR',
        nextDueDate: '2025-05-15',
        userId: 'user-123',
        reminderId: 'rem-123',
        reminderChannel: 'push',
        daysBefore: 3,
      };

      // First call returns renewal rows, second call returns empty (no trial endings)
      const qbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([mockRenewalRow]).mockResolvedValueOnce([]),
      };
      subscriptionRepository.createQueryBuilder.mockReturnValue(qbMock);
      expoPushService.sendToUsers.mockResolvedValue(new Map([['user-123', true]]));

      await task.handleCron();

      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledWith([
        {
          userId: 'user-123',
          title: 'Renouvellement Netflix dans 3 jour(s)',
          body: expect.stringContaining('15.99EUR sera renouvelé le'),
          data: expect.objectContaining({ type: 'subscription_renewal' }),
        },
      ]);
    });

    it('should create trial ending notifications and queue push', async () => {
      const mockTrialRow = {
        subscriptionId: 'sub-456',
        subscriptionName: 'Spotify',
        subscriptionAmount: 9.99,
        subscriptionCurrency: 'EUR',
        trialEndDate: '2025-05-18',
        userId: 'user-456',
        reminderId: 'rem-456',
        reminderChannel: 'push',
        daysBefore: 3,
      };

      // First call returns empty (no renewals), second call returns trial rows
      const qbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([mockTrialRow]),
      };
      subscriptionRepository.createQueryBuilder.mockReturnValue(qbMock);
      expoPushService.sendToUsers.mockResolvedValue(new Map([['user-456', true]]));

      await task.handleCron();

      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledWith([
        {
          userId: 'user-456',
          title: expect.stringContaining("Fin d'essai Spotify"),
          body: expect.stringContaining("période d'essai"),
          data: expect.objectContaining({ type: 'trial_ending' }),
        },
      ]);
    });

    it('should process both renewal and trial ending in one run', async () => {
      const mockRenewalRow = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Netflix',
        subscriptionAmount: 15.99,
        subscriptionCurrency: 'EUR',
        nextDueDate: '2025-05-15',
        userId: 'user-123',
        reminderId: 'rem-123',
        reminderChannel: 'push',
        daysBefore: 3,
      };

      const mockTrialRow = {
        subscriptionId: 'sub-456',
        subscriptionName: 'Spotify',
        subscriptionAmount: 9.99,
        subscriptionCurrency: 'EUR',
        trialEndDate: '2025-05-18',
        userId: 'user-456',
        reminderId: 'rem-456',
        reminderChannel: 'push',
        daysBefore: 3,
      };

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValueOnce([mockRenewalRow])
          .mockResolvedValueOnce([mockTrialRow]),
      };
      subscriptionRepository.createQueryBuilder.mockReturnValue(qbMock);
      expoPushService.sendToUsers.mockResolvedValue(
        new Map([
          ['user-123', true],
          ['user-456', true],
        ]),
      );

      await task.handleCron();

      expect(notificationRepository.save).toHaveBeenCalledTimes(2);
      expect(expoPushService.sendToUsers).toHaveBeenCalledTimes(1);
      // Both payloads should be sent in a single batch
      expect(expoPushService.sendToUsers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-123' }),
          expect.objectContaining({ userId: 'user-456' }),
        ]),
      );
    });
  });

  describe('triggerManually', () => {
    it('should return processed statistics', async () => {
      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 0,
        notificationsCreated: 0,
        pushSent: 0,
      });
    });
  });
});
