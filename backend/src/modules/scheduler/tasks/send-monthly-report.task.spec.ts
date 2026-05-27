import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SendMonthlyReportTask } from './send-monthly-report.task';
import { UserPreferenceEntity } from '../../../infrastructure/database/entities/user-preference.entity';
import { EUser } from '../../../infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { IEmailService } from '../../auth/infrastructure/services/email.service';

const makeSub = (overrides: Record<string, any> = {}) => ({
  id: 'sub-1',
  userId: 'user-1',
  name: 'Netflix',
  amount: 15.99,
  currency: 'EUR',
  frequency: 'monthly',
  status: 'active',
  startDate: new Date('2024-01-01'),
  category: { name: 'Streaming' },
  ...overrides,
});

describe('SendMonthlyReportTask', () => {
  let task: SendMonthlyReportTask;
  let preferencesRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;
  let emailService: jest.Mocked<IEmailService>;

  const setupUsers = (users: any[]) => {
    preferencesRepository.find.mockResolvedValue(users.map(u => ({ userId: u.id })));
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(users),
    };
    userRepository.createQueryBuilder.mockReturnValue(qb);
  };

  const setupSingleUser = (overrides: Record<string, any> = {}) => {
    setupUsers([{ id: 'user-1', email: 'test@example.com', firstName: 'Test', ...overrides }]);
  };

  beforeEach(async () => {
    preferencesRepository = { find: jest.fn() };
    userRepository = { createQueryBuilder: jest.fn() };
    subscriptionRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMonthlyReportTask,
        { provide: getRepositoryToken(UserPreferenceEntity), useValue: preferencesRepository },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
        { provide: getRepositoryToken(SubscriptionEntity), useValue: subscriptionRepository },
        {
          provide: IEmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
            sendVerificationEmail: jest.fn(),
            sendMonthlyReport: jest.fn(),
          },
        },
      ],
    }).compile();

    task = module.get(SendMonthlyReportTask);
    emailService = module.get(IEmailService);
  });

  it('should be defined', () => {
    expect(task).toBeDefined();
  });

  describe('triggerManually', () => {
    it('returns { sent: 0, failed: 0 } when no users opted in', async () => {
      preferencesRepository.find.mockResolvedValue([]);
      const result = await task.triggerManually();
      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(emailService.sendMonthlyReport).not.toHaveBeenCalled();
    });

    it('sends report to eligible user', async () => {
      setupUsers([{ id: 'user-1', email: 'john@example.com', firstName: 'John' }]);
      subscriptionRepository.find.mockResolvedValue([makeSub()]);
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

    it('counts failed emails without stopping the batch', async () => {
      setupUsers([
        { id: 'user-1', email: 'a@example.com', firstName: 'A' },
        { id: 'user-2', email: 'b@example.com', firstName: 'B' },
      ]);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 1 });
      expect(emailService.sendMonthlyReport).toHaveBeenCalledTimes(2);
    });

    it('uses email prefix as userName when firstName is empty', async () => {
      setupUsers([{ id: 'user-1', email: 'jane@example.com', firstName: '' }]);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      expect(emailService.sendMonthlyReport).toHaveBeenCalledWith({
        to: 'jane@example.com',
        data: expect.objectContaining({ userName: 'jane' }),
      });
    });

    it('calculates category summary and identifies top category', async () => {
      setupSingleUser();
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ name: 'Netflix', amount: 15.99, category: { name: 'Streaming' } }),
        makeSub({ id: 'sub-2', name: 'Spotify', amount: 9.99, category: { name: 'Streaming' } }),
        makeSub({ id: 'sub-3', name: 'Gym', amount: 30, category: { name: 'Sport' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.topCategory).toEqual({ name: 'Sport', total: 30 });
      expect(call.data.categorySummary).toEqual(
        expect.arrayContaining([
          { name: 'Sport', total: 30 },
          { name: 'Streaming', total: 25.98 },
        ]),
      );
      expect(call.data.activeSubscriptionsCount).toBe(3);
    });

    it('converts yearly subscription to monthly amount', async () => {
      setupSingleUser();
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 120, frequency: 'yearly', category: { name: 'Cloud' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(10);
    });

    it('converts weekly subscription to monthly amount', async () => {
      setupSingleUser();
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 10, frequency: 'weekly', category: { name: 'Hebdo' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBeCloseTo(43.3, 1);
    });

    it('converts quarterly subscription to monthly amount', async () => {
      setupSingleUser();
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 90, frequency: 'quarterly', category: { name: 'Trim' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(30);
    });

    it('handles one-time subscription with default frequency', async () => {
      setupSingleUser();
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 50, frequency: 'one-time', category: { name: 'Achat' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(50);
    });

    it('reports trend up when previous month had no expenses', async () => {
      setupSingleUser();
      const recentStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5);
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 20, startDate: recentStart, category: { name: 'New' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.trend).toBe('up');
      expect(call.data.percentageChange).toBe(100);
    });

    it('reports stable trend when both months have same expenses', async () => {
      setupSingleUser();
      const oldStart = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1);
      subscriptionRepository.find.mockResolvedValue([makeSub({ startDate: oldStart })]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = (emailService.sendMonthlyReport as jest.Mock).mock.calls[0][0];
      expect(call.data.trend).toBe('stable');
      expect(call.data.percentageChange).toBe(0);
    });
  });

  describe('handleCron', () => {
    it('completes without throwing', async () => {
      preferencesRepository.find.mockResolvedValue([]);
      await expect(task.handleCron()).resolves.not.toThrow();
    });

    it('catches and logs errors without throwing', async () => {
      preferencesRepository.find.mockRejectedValue(new Error('DB connection lost'));
      await expect(task.handleCron()).resolves.not.toThrow();
    });
  });
});
