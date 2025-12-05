import { Test, TestingModule } from '@nestjs/testing';
import { FindAllNotificationsUseCase } from './find-all-notifications.use-case';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { NotificationFilterAppDto } from '../dto/notification-filter-app.dto';

describe('FindAllNotificationsUseCase', () => {
  let useCase: FindAllNotificationsUseCase;
  let repository: jest.Mocked<INotificationRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<INotificationRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllNotificationsUseCase,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllNotificationsUseCase>(FindAllNotificationsUseCase);
    repository = module.get(NOTIFICATION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all notifications for a user', async () => {
    const filters: NotificationFilterAppDto = {
      userId: 'user-123',
      limit: 50,
      sort: 'created_at:desc',
    };

    const expectedNotifications = [
      new Notification({
        id: 'notif-1',
        userId: 'user-123',
        type: 'reminder',
        channel: 'push',
        title: 'Paiement Netflix dans 3 jours',
        body: 'Votre abonnement Netflix sera débité le 15 novembre',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
      }),
      new Notification({
        id: 'notif-2',
        userId: 'user-123',
        type: 'payment_overdue',
        channel: 'email',
        title: 'Paiement en retard',
        body: 'Votre paiement Spotify est en retard',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedNotifications);

    const result = await useCase.execute(filters);

    expect(result).toBe(expectedNotifications);
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should filter notifications by type', async () => {
    const filters: NotificationFilterAppDto = {
      userId: 'user-123',
      type: 'reminder',
    };

    const expectedNotifications = [
      new Notification({
        id: 'notif-1',
        userId: 'user-123',
        type: 'reminder',
        channel: 'push',
        title: 'Rappel',
        body: 'Paiement dans 3 jours',
        status: 'sent',
        createdAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedNotifications);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('reminder');
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should filter notifications by read status', async () => {
    const filters: NotificationFilterAppDto = {
      userId: 'user-123',
      isRead: false,
    };

    const expectedNotifications = [
      new Notification({
        id: 'notif-1',
        userId: 'user-123',
        type: 'reminder',
        channel: 'push',
        title: 'Non lue',
        body: 'Message non lu',
        status: 'sent',
        createdAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedNotifications);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].readAt).toBeUndefined();
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty array when no notifications found', async () => {
    const filters: NotificationFilterAppDto = {
      userId: 'user-999',
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(filters);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });
});
