import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SnoozeNotificationUseCase } from './snooze-notification.use-case';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { SnoozeNotificationAppDto } from '../dto/snooze-notification-app.dto';
import { makeNotification } from '../../__fixtures__/notification.fixtures';

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
    const notificationId = 'notif-1';
    const userId = 'user-1';
    const snoozedUntil = new Date(Date.now() + 3600000); // 1 hour in the future
    const dto: SnoozeNotificationAppDto = { snoozedUntil };

    const notification = makeNotification({ id: notificationId, userId });
    const snoozedNotification = makeNotification({
      id: notificationId,
      userId,
      status: 'snoozed',
      snoozedUntil,
    });

    repository.findById.mockResolvedValue(notification);
    repository.update.mockResolvedValue(snoozedNotification);

    const result = await useCase.execute(notificationId, userId, dto);

    expect(result).toBe(snoozedNotification);
    expect(repository.findById).toHaveBeenCalledWith(notificationId);
    expect(repository.update).toHaveBeenCalledWith(notificationId, expect.any(Notification));
  });

  it('should throw NotFoundException when notification does not exist', async () => {
    const notificationId = 'non-existent';
    const userId = 'user-1';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() + 3600000),
    };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
  });

  it('should throw NotFoundException when notification belongs to another user', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() + 3600000),
    };

    const notification = makeNotification({ id: notificationId, userId: 'other-user' });
    repository.findById.mockResolvedValue(notification);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
  });

  it('should throw NotFoundException when update returns null', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';
    const snoozedUntil = new Date(Date.now() + 3600000);
    const dto: SnoozeNotificationAppDto = { snoozedUntil };

    const notification = makeNotification({ id: notificationId, userId });
    repository.findById.mockResolvedValue(notification);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow(
      `Failed to snooze notification with ID ${notificationId}`,
    );
  });

  it('should propagate repository errors', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';
    const dto: SnoozeNotificationAppDto = {
      snoozedUntil: new Date(Date.now() + 3600000),
    };

    repository.findById.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(notificationId, userId, dto)).rejects.toThrow('Database error');
  });
});
