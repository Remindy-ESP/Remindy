import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SendMonthlyReportTask } from '../src/modules/scheduler/tasks/send-monthly-report.task';
import { UserPreferenceEntity } from '../src/infrastructure/database/entities/user-preference.entity';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../src/modules/subscription/infrastructure/persistence/subscription.entity';
import { IEmailService } from '../src/modules/auth/infrastructure/services/email.service';

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    task = moduleFixture.get(SendMonthlyReportTask);
    emailService = moduleFixture.get(IEmailService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupUsers = (users: any[]) => {
    preferencesRepository.find.mockResolvedValue(users.map(u => ({ userId: u.id })));
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(users),
    };
    userRepository.createQueryBuilder.mockReturnValue(qb);
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
        makeSub({ name: 'Netflix', amount: 15.99, category: { name: 'Streaming' } }),
        makeSub({ id: 'sub-2', name: 'Spotify', amount: 9.99, category: { name: 'Streaming' } }),
        makeSub({
          id: 'sub-3',
          name: 'Salle de sport',
          amount: 360,
          frequency: 'yearly',
          category: { name: 'Sport' },
        }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 0 });
      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.to).toBe('alice@example.com');
      expect(call.data.userName).toBe('Alice');
      expect(call.data.activeSubscriptionsCount).toBe(3);
      expect(call.data.totalExpenses).toBeCloseTo(55.98, 1);
      expect(call.data.topCategory).toBeDefined();
      expect(call.data.currency).toBe('EUR');
    });

    it('processes multiple users with rate limiting', async () => {
      setupUsers([
        { id: 'user-1', email: 'a@example.com', firstName: 'A' },
        { id: 'user-2', email: 'b@example.com', firstName: 'B' },
        { id: 'user-3', email: 'c@example.com', firstName: 'C' },
      ]);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const start = Date.now();
      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 3, failed: 0 });
      expect(Date.now() - start).toBeGreaterThanOrEqual(350);
    });

    it('continues sending when one user fails', async () => {
      setupUsers([
        { id: 'user-1', email: 'fail@example.com', firstName: 'Fail' },
        { id: 'user-2', email: 'ok@example.com', firstName: 'Ok' },
      ]);
      subscriptionRepository.find.mockResolvedValue([makeSub()]);
      emailService.sendMonthlyReport
        .mockRejectedValueOnce(new Error('SMTP timeout'))
        .mockResolvedValueOnce(undefined);

      const result = await task.triggerManually();
      expect(result).toEqual({ sent: 1, failed: 1 });
    });

    it('excludes cancelled subscriptions', async () => {
      setupUsers([{ id: 'user-1', email: 'test@example.com', firstName: 'Test' }]);
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 20, category: { name: 'Active' } }),
        makeSub({
          id: 'sub-2',
          amount: 50,
          status: 'cancelled',
          endDate: new Date('2024-06-01'),
          category: { name: 'Cancelled' },
        }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.activeSubscriptionsCount).toBe(1);
      expect(call.data.totalExpenses).toBe(20);
    });

    it('handles user with no subscriptions', async () => {
      setupUsers([{ id: 'user-1', email: 'empty@example.com', firstName: 'Empty' }]);
      subscriptionRepository.find.mockResolvedValue([]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      const result = await task.triggerManually();

      expect(result).toEqual({ sent: 1, failed: 0 });
      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(0);
      expect(call.data.categorySummary).toEqual([]);
      expect(call.data.topCategory).toBeNull();
    });

    it('converts weekly subscriptions to monthly equivalent', async () => {
      setupUsers([{ id: 'user-1', email: 'w@example.com', firstName: 'W' }]);
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 10, frequency: 'weekly', category: { name: 'Hebdo' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.totalExpenses).toBeCloseTo(43.3, 1);
    });

    it('converts quarterly subscriptions to monthly equivalent', async () => {
      setupUsers([{ id: 'user-1', email: 'q@example.com', firstName: 'Q' }]);
      subscriptionRepository.find.mockResolvedValue([
        makeSub({ amount: 90, frequency: 'quarterly', category: { name: 'Trim' } }),
      ]);
      emailService.sendMonthlyReport.mockResolvedValue(undefined);

      await task.triggerManually();

      const call = emailService.sendMonthlyReport.mock.calls[0][0];
      expect(call.data.totalExpenses).toBe(30);
    });
  });
});
