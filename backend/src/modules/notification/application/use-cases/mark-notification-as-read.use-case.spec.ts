import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MarkNotificationAsReadUseCase } from './mark-notification-as-read.use-case';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { makeNotification } from '../../__fixtures__/notification.fixtures';

describe('MarkNotificationAsReadUseCase', () => {
  let useCase: MarkNotificationAsReadUseCase;
  let repository: jest.Mocked<INotificationRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<INotificationRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkNotificationAsReadUseCase,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<MarkNotificationAsReadUseCase>(MarkNotificationAsReadUseCase);
    repository = module.get(NOTIFICATION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should mark a notification as read successfully', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';

    const notification = makeNotification({ id: notificationId, userId });
    const updatedNotification = makeNotification({ id: notificationId, userId });
    // Don't pre-mark the returned notification as it will be marked in the use case

    repository.findById.mockResolvedValue(notification);
    repository.update.mockResolvedValue(updatedNotification);

    const result = await useCase.execute(notificationId, userId);

    expect(result).toBe(updatedNotification);
    expect(repository.findById).toHaveBeenCalledWith(notificationId);
    expect(repository.update).toHaveBeenCalledWith(notificationId, expect.any(Notification));
  });

  it('should throw NotFoundException when notification does not exist', async () => {
    const notificationId = 'non-existent';
    const userId = 'user-1';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
  });

  it('should throw NotFoundException when notification belongs to another user', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';

    const notification = makeNotification({ id: notificationId, userId: 'other-user' });
    repository.findById.mockResolvedValue(notification);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
  });

  it('should throw NotFoundException when update returns null', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';

    // Use mockImplementation to return fresh instances each call (so markAsRead doesn't throw on repeated calls)
    repository.findById.mockImplementation(async () =>
      makeNotification({ id: notificationId, userId }),
    );
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(
      `Failed to mark notification with ID ${notificationId} as read`,
    );
  });

  it('should propagate repository errors', async () => {
    const notificationId = 'notif-1';
    const userId = 'user-1';

    repository.findById.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow('Database error');
  });
});
