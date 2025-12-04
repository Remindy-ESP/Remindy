import { Test, TestingModule } from '@nestjs/testing';
import { FindAllRemindersUseCase } from './find-all-reminders.use-case';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { ReminderFilterAppDto } from '../dto/reminder-filter-app.dto';

describe('FindAllRemindersUseCase', () => {
  let useCase: FindAllRemindersUseCase;
  let repository: jest.Mocked<IReminderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IReminderRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllRemindersUseCase,
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllRemindersUseCase>(FindAllRemindersUseCase);
    repository = module.get(REMINDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all reminders for a user', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-123',
    };
    const expectedReminders = [
      new Reminder({
        id: 'reminder-1',
        userId: filters.userId,
        subscriptionId: 'sub-1',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-2',
        userId: filters.userId,
        subscriptionId: 'sub-2',
        type: 'payment_failed',
        daysBefore: 1,
        enabled: true,
        channel: 'push',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedReminders);

    const result = await useCase.execute(filters);

    expect(result).toBe(expectedReminders);
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when user has no reminders', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-999',
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(filters);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should find all reminders with different types', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-456',
    };
    const expectedReminders = [
      new Reminder({
        id: 'reminder-1',
        userId: filters.userId,
        subscriptionId: 'sub-1',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-2',
        userId: filters.userId,
        subscriptionId: 'sub-2',
        type: 'payment_failed',
        daysBefore: 1,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-3',
        userId: filters.userId,
        subscriptionId: 'sub-3',
        type: 'subscription_renewal',
        daysBefore: 14,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedReminders);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(3);
    expect(result.map(r => r.type)).toEqual([
      'payment_due',
      'payment_failed',
      'subscription_renewal',
    ]);
  });

  it('should find reminders with different channels', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-789',
    };
    const expectedReminders = [
      new Reminder({
        id: 'reminder-1',
        userId: filters.userId,
        subscriptionId: 'sub-1',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-2',
        userId: filters.userId,
        subscriptionId: 'sub-2',
        type: 'payment_due',
        daysBefore: 1,
        enabled: true,
        channel: 'push',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-3',
        userId: filters.userId,
        subscriptionId: 'sub-3',
        type: 'payment_due',
        daysBefore: 7,
        enabled: true,
        channel: 'sms',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedReminders);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(3);
    expect(result.map(r => r.channel)).toEqual(['email', 'push', 'sms']);
  });

  it('should find both enabled and disabled reminders', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-111',
    };
    const expectedReminders = [
      new Reminder({
        id: 'reminder-1',
        userId: filters.userId,
        subscriptionId: 'sub-1',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-2',
        userId: filters.userId,
        subscriptionId: 'sub-2',
        type: 'payment_due',
        daysBefore: 1,
        enabled: false,
        channel: 'push',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedReminders);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(2);
    expect(result[0].enabled).toBe(true);
    expect(result[1].enabled).toBe(false);
  });

  it('should find reminders for different subscriptions', async () => {
    const filters: ReminderFilterAppDto = {
      userId: 'user-222',
    };
    const expectedReminders = [
      new Reminder({
        id: 'reminder-1',
        userId: filters.userId,
        subscriptionId: 'sub-1',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-2',
        userId: filters.userId,
        subscriptionId: 'sub-2',
        type: 'payment_due',
        daysBefore: 7,
        enabled: true,
        channel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Reminder({
        id: 'reminder-3',
        userId: filters.userId,
        subscriptionId: 'sub-3',
        type: 'payment_due',
        daysBefore: 1,
        enabled: true,
        channel: 'push',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedReminders);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(3);
    const subscriptionIds = result.map(r => r.subscriptionId);
    expect(subscriptionIds).toEqual(['sub-1', 'sub-2', 'sub-3']);
  });
});
