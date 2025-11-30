import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteReminderUseCase } from './delete-reminder.use-case';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';

describe('DeleteReminderUseCase', () => {
  let useCase: DeleteReminderUseCase;
  let repository: jest.Mocked<IReminderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IReminderRepository>> = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReminderUseCase,
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteReminderUseCase>(DeleteReminderUseCase);
    repository = module.get(REMINDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete an existing reminder', async () => {
    const reminderId = 'reminder-123';
    const userId = 'user-123';
    const existingReminder = new Reminder({
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

    repository.findById.mockResolvedValue(existingReminder);
    repository.delete.mockResolvedValue(undefined);

    await useCase.execute(reminderId, userId);

    expect(repository.findById).toHaveBeenCalledWith(reminderId);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith(reminderId);
    expect(repository.delete).toHaveBeenCalledTimes(1);
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
    expect(repository.delete).not.toHaveBeenCalled();
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
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should delete a disabled reminder', async () => {
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
    repository.delete.mockResolvedValue(undefined);

    await useCase.execute(reminderId, userId);

    expect(repository.findById).toHaveBeenCalledWith(reminderId);
    expect(repository.delete).toHaveBeenCalledWith(reminderId);
  });

  it('should delete a push notification reminder', async () => {
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
    repository.delete.mockResolvedValue(undefined);

    await useCase.execute(reminderId, userId);

    expect(repository.delete).toHaveBeenCalledWith(reminderId);
  });

  it('should delete a reminder with subscription_renewal type', async () => {
    const reminderId = 'reminder-111';
    const userId = 'user-111';
    const renewalReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-111',
      type: 'subscription_renewal',
      daysBefore: 14,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(renewalReminder);
    repository.delete.mockResolvedValue(undefined);

    await useCase.execute(reminderId, userId);

    expect(repository.delete).toHaveBeenCalledWith(reminderId);
  });
});
