import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SendMonthlyReportTask } from '../src/modules/scheduler/tasks/send-monthly-report.task';
import { UserPreferenceEntity } from '../src/infrastructure/database/entities/user-preference.entity';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../src/modules/subscription/infrastructure/persistence/subscription.entity';
import { IEmailService } from '../src/modules/auth/infrastructure/services/email.service';

describe('Monthly Report (e2e)', () => {
  let task: SendMonthlyReportTask;
  let emailService: jest.Mocked<IEmailService>;
  let preferencesRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;

  beforeAll(async () => {
    preferencesRepository = { find: jest.fn() };
    userRepository = { createQueryBuilder: jest.fn() };
    subscriptionRepository = { find: jest.fn() };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      sendMonthlyReport: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        SendMonthlyReportTask,
        { provide: getRepositoryToken(UserPreferenceEntity), useValue: preferencesRepository },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
        { provide: getRepositoryToken(SubscriptionEntity), useValue: subscriptionRepository },
        { provide: IEmailService, useValue: mockEmailService },
      ],
    }).compile();

    task = moduleFixture.get(SendMonthlyReportTask);
    emailService = moduleFixture.get(IEmailService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupUsers = (users: any[]) => {
    preferencesRepository.find.mockResolvedValue(
      users.map(u => ({ userId: u.id })),
    );
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(users),
    };
    userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  };

  describe('Full flow — triggerManually', () => {
    it('sends nothing when no users opted in', async () => {
      preferencesRepository.find.mockResolvedValue([]);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(emailService.sendMonthlyReport).not.toHaveBeenCalled();
    });

    it('sends a complete report for a user with multiple subscriptions', async () => {
      setupUsers([{ id: 'user-1', email: 'alice@example.com', firstName: 'Alice' }]);

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
          name: 'Salle de sport',
          amount: 360,
          currency: 'EUR',
          frequency: 'yearly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Sport' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 0 });
      expect(emailService.sendMonthlyReport).toHaveBeenCalledTimes(1);

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.to).toBe('alice@example.com');
      expect(call.data.userName).toBe('Alice');
      expect(call.data.activeSubscriptionsCount).toBe(3);
      expect(call.data.totalExpenses).toBeCloseTo(55.98, 1);
      expect(call.data.categorySummary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Sport' }),
          expect.objectContaining({ name: 'Streaming' }),
        ]),
      );
      expect(call.data.topCategory).toBeDefined();
      expect(call.data.currency).toBe('EUR');
      expect(call.data.month).toBeDefined();
    });

    it('processes multiple users sequentially with rate limiting', async () => {
      setupUsers([
        { id: 'user-1', email: 'a@example.com', firstName: 'A' },
        { id: 'user-2', email: 'b@example.com', firstName: 'B' },
        { id: 'user-3', email: 'c@example.com', firstName: 'C' },
      ]);

      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const start = Date.now();
      const result = await task.triggerManually();
      const elapsed = Date.now() - start;

      expect(result).toEqual({ sent: 3, failed: 0 });
      expect(emailService.sendMonthlyReport).toHaveBeenCalledTimes(3);
      // 3 users × 200ms delay between each = at least 400ms total
      expect(elapsed).toBeGreaterThanOrEqual(350);
    });

    it('continues sending to remaining users when one fails', async () => {
      setupUsers([
        { id: 'user-1', email: 'fail@example.com', firstName: 'Fail' },
        { id: 'user-2', email: 'ok@example.com', firstName: 'Ok' },
      ]);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Test',
          amount: 10,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Divers' },
        },
      ]);

      emailService.sendMonthlyReport
        .mockRejectedValueOnce(new Error('SMTP timeout'))
        .mockResolvedValueOnce(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 1 });
    });

    it('excludes cancelled subscriptions from the report', async () => {
      setupUsers([{ id: 'user-1', email: 'test@example.com', firstName: 'Test' }]);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Active Sub',
          amount: 20,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Active' },
        },
        {
          id: 'sub-2',
          userId: 'user-1',
          name: 'Cancelled Sub',
          amount: 50,
          currency: 'EUR',
          frequency: 'monthly',
          status: 'cancelled',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-01'),
          category: { name: 'Cancelled' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.activeSubscriptionsCount).toBe(1);
      expect(call.data.totalExpenses).toBe(20);
    });

    it('handles user with no subscriptions gracefully', async () => {
      setupUsers([{ id: 'user-1', email: 'empty@example.com', firstName: 'Empty' }]);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 0 });
      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(0);
      expect(call.data.activeSubscriptionsCount).toBe(0);
      expect(call.data.categorySummary).toEqual([]);
      expect(call.data.topCategory).toBeNull();
      expect(call.data.trend).toBe('stable');
    });

    it('converts weekly subscriptions to monthly equivalent', async () => {
      setupUsers([{ id: 'user-1', email: 'weekly@example.com', firstName: 'W' }]);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Weekly sub',
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

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      // 10 * 4.33 = 43.3
      expect(call.data.totalExpenses).toBeCloseTo(43.3, 1);
    });

    it('converts quarterly subscriptions to monthly equivalent', async () => {
      setupUsers([{ id: 'user-1', email: 'quarterly@example.com', firstName: 'Q' }]);

      subscriptionRepository.find.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Quarterly sub',
          amount: 90,
          currency: 'EUR',
          frequency: 'quarterly',
          status: 'active',
          startDate: new Date('2024-01-01'),
          category: { name: 'Trimestriel' },
        },
      ]);

      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      // 90 / 3 = 30
      expect(call.data.totalExpenses).toBe(30);
    });
  });
});
