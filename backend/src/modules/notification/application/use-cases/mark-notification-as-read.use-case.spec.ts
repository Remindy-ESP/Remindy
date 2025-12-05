import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MarkNotificationAsReadUseCase } from './mark-notification-as-read.use-case';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';

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

  it('should mark notification as read successfully', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';

    const existingNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Paiement Netflix',
      body: 'Dans 3 jours',
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
    });

    const updatedNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Paiement Netflix',
      body: 'Dans 3 jours',
      status: 'sent',
      sentAt: existingNotification.sentAt,
      readAt: new Date(),
      createdAt: existingNotification.createdAt,
    });

    repository.findById.mockResolvedValue(existingNotification);
    repository.update.mockResolvedValue(updatedNotification);

    const result = await useCase.execute(notificationId, userId);

    expect(result.readAt).toBeDefined();
    expect(repository.findById).toHaveBeenCalledWith(notificationId);
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when notification does not exist', async () => {
    const notificationId = 'non-existent';
    const userId = 'user-123';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(
      `Notification with ID ${notificationId} not found`,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when notification belongs to different user', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';
    const differentUserId = 'user-456';

    const existingNotification = new Notification({
      id: notificationId,
      userId: differentUserId,
      type: 'reminder',
      channel: 'push',
      title: 'Test',
      body: 'Test',
      status: 'sent',
      createdAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingNotification);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw error when notification is already read', async () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';

    const existingNotification = new Notification({
      id: notificationId,
      userId,
      type: 'reminder',
      channel: 'push',
      title: 'Test',
      body: 'Test',
      status: 'sent',
      readAt: new Date(), // Already read
      createdAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingNotification);

    await expect(useCase.execute(notificationId, userId)).rejects.toThrow(
      'Notification already marked as read',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
