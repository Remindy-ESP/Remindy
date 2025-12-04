import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateReminderUseCase } from './update-reminder.use-case';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { UpdateReminderAppDto } from '../dto/update-reminder-app.dto';

describe('UpdateReminderUseCase', () => {
  let useCase: UpdateReminderUseCase;
  let repository: jest.Mocked<IReminderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IReminderRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateReminderUseCase,
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateReminderUseCase>(UpdateReminderUseCase);
    repository = module.get(REMINDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update reminder daysBefore', async () => {
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

    const dto: UpdateReminderAppDto = {
      daysBefore: 7,
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-123',
      type: 'payment_due',
      daysBefore: 7,
      enabled: true,
      channel: 'email',
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.daysBefore).toBe(7);
    expect(repository.findById).toHaveBeenCalledWith(reminderId);
    expect(repository.update).toHaveBeenCalledWith(reminderId, expect.any(Reminder));
  });

  it('should update reminder channel', async () => {
    const reminderId = 'reminder-456';
    const userId = 'user-456';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-456',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      channel: 'push',
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-456',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'push',
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.channel).toBe('push');
  });

  it('should enable reminder', async () => {
    const reminderId = 'reminder-789';
    const userId = 'user-789';
    const existingReminder = new Reminder({
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

    const dto: UpdateReminderAppDto = {
      enabled: true,
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-789',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.enabled).toBe(true);
  });

  it('should disable reminder', async () => {
    const reminderId = 'reminder-999';
    const userId = 'user-999';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-999',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      enabled: false,
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-999',
      type: 'payment_due',
      daysBefore: 3,
      enabled: false,
      channel: 'email',
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.enabled).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const reminderId = 'reminder-111';
    const userId = 'user-111';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-111',
      type: 'payment_due',
      daysBefore: 3,
      enabled: false,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      daysBefore: 10,
      channel: 'sms',
      enabled: true,
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-111',
      type: 'payment_due',
      daysBefore: 10,
      channel: 'sms',
      enabled: true,
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.daysBefore).toBe(10);
    expect(result.channel).toBe('sms');
    expect(result.enabled).toBe(true);
  });

  it('should throw NotFoundException when reminder does not exist', async () => {
    const reminderId = 'non-existent-id';
    const userId = 'user-222';
    const dto: UpdateReminderAppDto = { daysBefore: 5 };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(
      `Reminder with ID ${reminderId} not found`,
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when reminder belongs to different user', async () => {
    const reminderId = 'reminder-333';
    const userId = 'user-333';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: 'user-999',
      subscriptionId: 'sub-333',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = { daysBefore: 5 };

    repository.findById.mockResolvedValue(existingReminder);

    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when domain validation fails', async () => {
    const reminderId = 'reminder-444';
    const userId = 'user-444';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-444',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      daysBefore: -1,
    };

    repository.findById.mockResolvedValue(existingReminder);

    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when update fails', async () => {
    const reminderId = 'reminder-555';
    const userId = 'user-555';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-555',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      daysBefore: 5,
    };

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(reminderId, userId, dto)).rejects.toThrow(
      `Failed to update reminder with ID ${reminderId}`,
    );
  });

  it('should update reminder to 1 day before', async () => {
    const reminderId = 'reminder-666';
    const userId = 'user-666';
    const existingReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-666',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto: UpdateReminderAppDto = {
      daysBefore: 1,
    };

    const updatedReminder = new Reminder({
      id: reminderId,
      userId: userId,
      subscriptionId: 'sub-666',
      type: 'payment_due',
      daysBefore: 1,
      enabled: true,
      channel: 'email',
      createdAt: existingReminder.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingReminder);
    repository.update.mockResolvedValue(updatedReminder);

    const result = await useCase.execute(reminderId, userId, dto);

    expect(result.daysBefore).toBe(1);
  });
});
