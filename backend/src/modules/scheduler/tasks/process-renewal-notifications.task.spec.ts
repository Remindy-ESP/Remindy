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
      createQueryBuilder: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
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
    it('should query due notifications and log if 0 found', async () => {
      subscriptionRepository.getRawMany.mockResolvedValue([]);

      await task.handleCron();

      expect(subscriptionRepository.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(subscriptionRepository.getRawMany).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Found 0 due notification(s) to create');
      expect(notificationRepository.save).not.toHaveBeenCalled();
      expect(expoPushService.sendToUsers).not.toHaveBeenCalled();
    });

    it('should create notifications and queue push if due notifications found', async () => {
      const mockRow = {
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

      subscriptionRepository.getRawMany.mockResolvedValue([mockRow]);
      expoPushService.sendToUsers.mockResolvedValue(new Map([['user-123', true]]));

      await task.handleCron();

      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledTimes(1);
      expect(expoPushService.sendToUsers).toHaveBeenCalledWith([
        {
          userId: 'user-123',
          title: 'Renouvellement Netflix dans 3 jour(s)',
          body: expect.stringContaining('15.99EUR sera renouvelé le'),
          data: expect.any(Object),
        },
      ]);
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Created: 1, Push sent: 1'));
    });
  });

  describe('triggerManually', () => {
    it('should return processed statistics', async () => {
      subscriptionRepository.getRawMany.mockResolvedValue([]);
      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 0,
        notificationsCreated: 0,
        pushSent: 0,
      });
    });
  });
});
