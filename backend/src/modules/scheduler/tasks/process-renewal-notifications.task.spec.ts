import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ProcessRenewalNotificationsTask } from './process-renewal-notifications.task';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { NOTIFICATION_REPOSITORY } from '../../notification/application/ports/notification-repository.interface';
import { ExpoPushService } from '../../notification/application/services/expo-push.service';
import { IEmailService } from '../../auth/infrastructure/services/email.service';
import { UserPreferenceEntity } from '../../../infrastructure/database/entities/user-preference.entity';
import { EUser } from '../../../infrastructure/database/entities/user.entity';

describe('ProcessRenewalNotificationsTask', () => {
  let task: ProcessRenewalNotificationsTask;
  let subscriptionRepository: any;
  let notificationRepository: any;
  let expoPushService: any;
  let emailService: any;
  let preferencesRepository: any;
  let userRepository: any;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    subscriptionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    notificationRepository = {
      save: jest.fn(),
    };

    expoPushService = {
      sendToUsers: jest.fn().mockResolvedValue(new Map()),
    };

    emailService = {
      sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    preferencesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
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
        {
          provide: IEmailService,
          useValue: emailService,
        },
        {
          provide: getRepositoryToken(UserPreferenceEntity),
          useValue: preferencesRepository,
        },
        {
          provide: getRepositoryToken(EUser),
          useValue: userRepository,
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

      // createQueryBuilder is called three times: once for trial transitions, once for renewals, once for trial endings
      expect(subscriptionRepository.createQueryBuilder).toHaveBeenCalledTimes(3);
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

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
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
          title: 'Renouvellement',
          body: expect.stringContaining('Netflix — renouvellement dans 3 jour(s)'),
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

      const qbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
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
          title: "Période d'essai",
          body: expect.stringContaining('Spotify — essai gratuit se termine dans 3 jour(s)'),
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
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
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

    it('should send email notifications when user has notificationEmail enabled', async () => {
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

      const subQbMock = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
        getRawMany: jest.fn().mockResolvedValueOnce([mockRenewalRow]).mockResolvedValueOnce([]),
      };
      subscriptionRepository.createQueryBuilder.mockReturnValue(subQbMock);
      expoPushService.sendToUsers.mockResolvedValue(new Map([['user-123', true]]));

      // Mock preferences: user has email enabled
      preferencesRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ userId: 'user-123', notificationEmail: true }]),
      });

      // Mock user email
      userRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'user-123', email: 'test@example.com' }]),
      });

      await task.handleCron();

      expect(emailService.sendNotificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        data: expect.objectContaining({
          type: 'subscription_renewal',
          subscriptionName: 'Netflix',
        }),
      });
    });
  });

  describe('triggerManually', () => {
    it('should return processed statistics', async () => {
      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 0,
        notificationsCreated: 0,
        pushSent: 0,
        emailsSent: 0,
      });
    });
  });
});
