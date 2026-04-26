import { Test, TestingModule } from '@nestjs/testing';
import { FindAllNotificationsUseCase } from './find-all-notifications.use-case';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../ports/notification-repository.interface';
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

  it('should return all notifications for a user', async () => {
    const filters: NotificationFilterAppDto = { userId: 'user-1' };
    const notifications = [
      new Notification({
        id: 'notif-1',
        userId: 'user-1',
        type: 'reminder',
        channel: 'email',
        title: 'Payment Due',
        body: 'Your payment is due',
        status: 'pending',
      }),
    ];

    repository.findAll.mockResolvedValue(notifications);

    const result = await useCase.execute(filters);

    expect(result).toBe(notifications);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty array when no notifications found', async () => {
    const filters: NotificationFilterAppDto = { userId: 'user-1', status: 'sent' };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(filters);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should pass all filters to repository', async () => {
    const filters: NotificationFilterAppDto = {
      userId: 'user-1',
      type: 'reminder',
      channel: 'email',
      status: 'sent',
      isRead: false,
      limit: 10,
      sort: 'created_at:desc',
    };

    repository.findAll.mockResolvedValue([]);

    await useCase.execute(filters);

    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should propagate repository errors', async () => {
    const filters: NotificationFilterAppDto = { userId: 'user-1' };

    repository.findAll.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(filters)).rejects.toThrow('Database error');
  });
});
