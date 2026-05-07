import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateReminderUseCase } from './create-reminder.use-case';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { CreateReminderAppDto } from '../dto/create-reminder-app.dto';

describe('CreateReminderUseCase', () => {
  let useCase: CreateReminderUseCase;
  let repository: jest.Mocked<IReminderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IReminderRepository>> = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReminderUseCase,
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateReminderUseCase>(CreateReminderUseCase);
    repository = module.get(REMINDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a reminder with all required fields', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-123',
      subscriptionId: 'sub-123',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-123',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedReminder);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: dto.userId,
        subscriptionId: dto.subscriptionId,
        type: dto.type,
        daysBefore: dto.daysBefore,
        enabled: dto.enabled,
        channel: dto.channel,
      }),
    );
  });

  it('should create a push notification reminder', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-456',
      subscriptionId: 'sub-456',
      type: 'payment_due',
      daysBefore: 1,
      enabled: true,
      channel: 'push',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-456',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.channel).toBe('push');
  });

  it('should create an SMS reminder', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-789',
      subscriptionId: 'sub-789',
      type: 'payment_due',
      daysBefore: 7,
      enabled: true,
      channel: 'sms',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-789',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.channel).toBe('sms');
  });

  it('should create a disabled reminder', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-999',
      subscriptionId: 'sub-999',
      type: 'payment_due',
      daysBefore: 3,
      enabled: false,
      channel: 'email',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-999',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.enabled).toBe(false);
  });

  it('should create a reminder with payment_failed type', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-111',
      subscriptionId: 'sub-111',
      type: 'payment_failed',
      daysBefore: 1,
      enabled: true,
      channel: 'email',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-111',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.type).toBe('payment_failed');
  });

  it('should create a reminder with subscription_renewal type', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-222',
      subscriptionId: 'sub-222',
      type: 'subscription_renewal',
      daysBefore: 14,
      enabled: true,
      channel: 'email',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-222',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.type).toBe('subscription_renewal');
  });

  it('should throw BadRequestException when domain validation fails', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-333',
      subscriptionId: 'sub-333',
      type: 'payment_due',
      daysBefore: -1,
      enabled: true,
      channel: 'email',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when userId is empty', async () => {
    const dto: CreateReminderAppDto = {
      userId: '',
      subscriptionId: 'sub-444',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should allow reminder without subscriptionId (for general reminders)', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-555',
      subscriptionId: undefined,
      type: 'budget_alert',
      daysBefore: 5,
      enabled: true,
      channel: 'email',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-555',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedReminder);
    expect(result.subscriptionId).toBeUndefined();
  });

  it('should create a reminder with 1 day before', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-666',
      subscriptionId: 'sub-666',
      type: 'payment_due',
      daysBefore: 1,
      enabled: true,
      channel: 'push',
    };

    const expectedReminder = new Reminder({
      id: 'reminder-666',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.save.mockResolvedValue(expectedReminder);

    const result = await useCase.execute(dto);

    expect(result.daysBefore).toBe(1);
  });

  it('should re-throw non-Error exceptions from repository', async () => {
    const dto: CreateReminderAppDto = {
      userId: 'user-999',
      subscriptionId: 'sub-999',
      type: 'payment_due',
      daysBefore: 3,
      enabled: true,
      channel: 'email',
    };

    const nonError = { code: 'DB_ERROR', message: 'raw db error' };
    repository.save.mockRejectedValue(nonError);

    await expect(useCase.execute(dto)).rejects.toBe(nonError);
  });
});
