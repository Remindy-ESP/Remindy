import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindReminderByIdUseCase } from './find-reminder-by-id.use-case';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';

describe('FindReminderByIdUseCase', () => {
  let useCase: FindReminderByIdUseCase;
  let repository: jest.Mocked<IReminderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IReminderRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReminderByIdUseCase,
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindReminderByIdUseCase>(FindReminderByIdUseCase);
    repository = module.get(REMINDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find a reminder by id', async () => {
    const reminderId = 'reminder-123';
    const userId = 'user-123';
    const expectedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-123',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result).toBe(expectedReminder);
    expect(result.id).toBe(reminderId);
    expect(result.userId).toBe(userId);
    expect(repository.findById).toHaveBeenCalledWith(reminderId);
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when reminder does not exist', async () => {
    const reminderId = 'non-existent-id';
    const userId = 'user-123';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(reminderId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(reminderId, userId)).rejects.toThrow(
      `Reminder with ID ${reminderId} not found`,
    );

    expect(repository.findById).toHaveBeenCalledWith(reminderId);
  });

  it('should throw NotFoundException when reminder belongs to different user', async () => {
    const reminderId = 'reminder-456';
    const userId = 'user-123';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: 'user-999',
      subscriptionId: 'sub-456',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);

    await expect(useCase.execute(reminderId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(reminderId, userId)).rejects.toThrow(
      `Reminder with ID ${reminderId} not found`,
    );

    expect(repository.findById).toHaveBeenCalledWith(reminderId);
  });

  it('should find a disabled reminder', async () => {
    const reminderId = 'reminder-789';
    const userId = 'user-456';
    const disabledReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-789',
      type: 'payment_due',
      daysBefore: 3,
      enabled: false,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(disabledReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result.enabled).toBe(false);
  });

  it('should find a push notification reminder', async () => {
    const reminderId = 'reminder-999';
    const userId = 'user-789';
    const pushReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-999',
      type: 'payment_due',
      daysBefore: 1,
      enabled: true,
      channel: 'push',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(pushReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result.channel).toBe('push');
  });

  it('should find a SMS reminder', async () => {
    const reminderId = 'reminder-111';
    const userId = 'user-111';
    const smsReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-111',
      type: 'payment_due',
      daysBefore: 7,
      enabled: true,
      channel: 'sms',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(smsReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result.channel).toBe('sms');
  });

  it('should find a payment_failed reminder', async () => {
    const reminderId = 'reminder-222';
    const userId = 'user-222';
    const failedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-222',
      type: 'payment_failed',
      daysBefore: 1,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(failedReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result.type).toBe('payment_failed');
  });

  it('should find a subscription_renewal reminder', async () => {
    const reminderId = 'reminder-333';
    const userId = 'user-333';
    const renewalReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-333',
      type: 'subscription_renewal',
      daysBefore: 14,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(renewalReminder);

    const result = await useCase.execute(reminderId, userId);

    expect(result.type).toBe('subscription_renewal');
  });
});
