import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SnoozeNotificationUseCase } from './snooze-notification.use-case';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { SnoozeNotificationAppDto } from '../dto/snooze-notification-app.dto';

describe('SnoozeNotificationUseCase', () => {
  let useCase: SnoozeNotificationUseCase;
  let repository: jest.Mocked<INotificationRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<INotificationRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnoozeNotificationUseCase,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<SnoozeNotificationUseCase>(SnoozeNotificationUseCase);
    repository = module.get(NOTIFICATION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should snooze a notification successfully', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';
    const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil,
    };

    const existingNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Paiement Netflix',
      body: 'Dans 3 jours',
      status: 'pending',
      createdAt: new Date(),
    });

    const updatedNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Paiement Netflix',
      body: 'Dans 3 jours',
      status: 'snoozed',
      snoozedUntil,
      createdAt: existingNotification.createdAt,
    });

    repository.findById.mockResolvedValue(existingNotification);
    repository.update.mockResolvedValue(updatedNotification);

    const result = await useCase.execute(notificationId, userId, dto);

    expect(result.status).toBe('snoozed');
    expect(result.snoozedUntil).toEqual(snoozedUntil);
    expect(repository.findById).toHaveBeenCalledWith(notificationId);
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when notification does not exist', async () => {
    const notificationId = 'non-existent';
    const userId = 'user-123';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when notification belongs to different user', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';
    const differentUserId = 'user-456';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    const existingNotification = new Notification({
      id: notificationId,
      userId: differentUserId,
      type: 'reminder',
      channel: 'push',
      title: 'Test',
      body: 'Test',
      status: 'pending',
      createdAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingNotification);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw error when snooze date is in the past', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    };

    const existingNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Test',
      body: 'Test',
      status: 'pending',
      createdAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingNotification);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(
      'Snooze date must be in the future',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
