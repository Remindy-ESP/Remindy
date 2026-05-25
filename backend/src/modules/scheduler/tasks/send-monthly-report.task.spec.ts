import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SendMonthlyReportTask } from './send-monthly-report.task';
import { UserPreferenceEntity } from '../../../infrastructure/database/entities/user-preference.entity';
import { EUser } from '../../../infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { IEmailService } from '../../auth/infrastructure/services/email.service';

describe('SendMonthlyReportTask', () => {
  let task: SendMonthlyReportTask;
  let preferencesRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;
  let emailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    preferencesRepository = {
      find: jest.fn(),
    };

    userRepository = {
      createQueryBuilder: jest.fn(),
    };

    subscriptionRepository = {
      find: jest.fn(),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      sendMonthlyReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMonthlyReportTask,
        { provide: getRepositoryToken(UserPreferenceEntity), useValue: preferencesRepository },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
        { provide: getRepositoryToken(SubscriptionEntity), useValue: subscriptionRepository },
        { provide: IEmailService, useValue: mockEmailService },
      ],
    }).compile();

    task = module.get(SendMonthlyReportTask);
    emailService = module.get(IEmailService);
  });

  it('should be defined', () => {
    expect(task).toBeDefined();
  });

  describe('triggerManually', () => {
    it('should return { sent: 0, failed: 0 } when no users have monthly report enabled', async () => {
      preferencesRepository.find.mockResolvedValue([]);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(emailService.sendMonthlyReport).not.toHaveBeenCalled();
    });

    it('should send report to eligible users', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15.99,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Streaming' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 0 });
      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'john@example.com',
        data: expect.objectContaining({
          userName: 'John',
          activeSubscriptionsCount: 1,
          currency: 'EUR',
        }),
      });
    });

    it('should count failed emails without stopping the batch', async () => {
      preferencesRepository.find.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      const mockUsers = [
        { id: 'user-1', email: 'a@example.com', firstName: 'A' },
        { id: 'user-2', email: 'b@example.com', firstName: 'B' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([]);

      emailService.sendMonthlyReport
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 1 });
      expect(emailService.sendMonthlyReport).toHaveBeenCalledTimes(2);
    });

    it('should use email prefix as userName when firstName is missing', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'jane@example.com', firstName: '' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'jane@example.com',
        data: expect.objectContaining({ userName: 'jane' }),
      });
    });

    it('should calculate category summary and top category correctly', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15.99,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Streaming' },
        },
        {
          id: 'sub-2',
          userId: 'user-1',
          name: 'Spotify',
          amount: 9.99,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Streaming' },
        },
        {
          id: 'sub-3',
          userId: 'user-1',
          name: 'Gym',
          amount: 30,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Sport' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'test@example.com',
        data: expect.objectContaining({
          topCategory: { name: 'Sport', total: 30 },
          categorySummary: expect.arrayContaining([
            { name: 'Sport', total: 30 },
            { name: 'Streaming', total: 25.98 },
          ]),
          activeSubscriptionsCount: 3,
        }),
      });
    });

    it('should convert yearly subscription to monthly amount', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'iCloud',
          amount: 120,
          currency: 'EUR',
          frequency: 'yearly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Cloud' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'test@example.com',
        data: expect.objectContaining({
          totalExpenses: 10,
          categorySummary: [{ name: 'Cloud', total: 10 }],
        }),
      });
    });

    it('should handle comparison with previous month (trend up)', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const now = new Date();
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15.99,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: twoMonthsAgo,
          category: { name: 'Streaming' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'test@example.com',
        data: expect.objectContaining({
          trend: 'stable',
          percentageChange: 0,
        }),
      });
    });

    it('should convert weekly subscription to monthly amount', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Weekly',
          amount: 10,
          currency: 'EUR',
          frequency: 'weekly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Hebdo' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);
      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBeCloseTo(43.3, 1);
    });

    it('should convert quarterly subscription to monthly amount', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Quarterly',
          amount: 90,
          currency: 'EUR',
          frequency: 'quarterly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Trim' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);
      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(30);
    });

    it('should handle one-time subscription with default frequency', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'One-time purchase',
          amount: 50,
          currency: 'EUR',
          frequency: 'one-time',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Achat' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);
      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(50);
    });

    it('should report trend up when previous month had no expenses', async () => {
      preferencesRepository.find.mockResolvedValue([{ userId: 'user-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        ]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const now = new Date();
      const recentStart = new Date(now.getFullYear(), now.getMonth() - 1, 5);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'New Sub',
          amount: 20,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: recentStart,
          category: { name: 'New' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);
      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.trend).toBe('up');
      expect(call.data.percentageChange).toBe(100);
    });
  });

  describe('handleCron', () => {
    it('should call processMonthlyReports and log result', async () => {
      preferencesRepository.find.mockResolvedValue([]);

      await expect(task.handleCron()).resolves.not.toThrow();
    });

    it('should catch and log errors without throwing', async () => {
      preferencesRepository.find.mockRejectedValue(new Error('DB connection lost'));

      await expect(task.handleCron()).resolves.not.toThrow();
    });
  });
});
