import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { NotificationController } from './notification.controller';
import { FindAllNotificationsUseCase } from '../../application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../../application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { Notification } from '../../domain/notification.entity';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let findAllNotificationsUseCase: jest.Mocked<FindAllNotificationsUseCase>;
  let snoozeNotificationUseCase: jest.Mocked<SnoozeNotificationUseCase>;
  let markNotificationAsReadUseCase: jest.Mocked<MarkNotificationAsReadUseCase>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRequest = {
    user: { userId: mockUserId, role: 'user_freemium' },
  } as any;

  const mockNotification = {
    id: 'notification-123',
    userId: mockUserId,
    type: 'reminder',
    channel: 'email',
    title: 'Payment Due',
    body: 'Your Netflix subscription payment is due',
    status: 'pending',
    isRead: false,
    sentAt: new Date('2025-01-15'),
    snoozeUntil: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  } as unknown as Notification;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: FindAllNotificationsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SnoozeNotificationUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: MarkNotificationAsReadUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    findAllNotificationsUseCase = module.get(FindAllNotificationsUseCase);
    snoozeNotificationUseCase = module.get(SnoozeNotificationUseCase);
    markNotificationAsReadUseCase = module.get(MarkNotificationAsReadUseCase);
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      const filters: NotificationFilterDto = {};
      findAllNotificationsUseCase.execute.mockResolvedValue([mockNotification]);

      const result = await controller.findAll(mockRequest, filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should pass filters to use case', async () => {
      const filters: NotificationFilterDto = {
        type: 'reminder',
        channel: 'email',
        status: 'sent',
        is_read: false,
      };
      findAllNotificationsUseCase.execute.mockResolvedValue([mockNotification]);

      await controller.findAll(mockRequest, filters);

      expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'reminder',
          channel: 'email',
          status: 'sent',
          isRead: false,
        }),
      );
    });
  });

  describe('snooze', () => {
    it('should snooze a notification', async () => {
      const snoozeDto: SnoozeNotificationDto = {
        snoozed_until: '2025-01-20T10:00:00.000Z',
      };
      const snoozedNotification = {
        ...mockNotification,
        snoozedUntil: new Date('2025-01-20T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02'),
      } as unknown as Notification;
      snoozeNotificationUseCase.execute.mockResolvedValue(snoozedNotification);

      const result = await controller.snooze(mockRequest, 'notification-123', snoozeDto);

      expect(result).toBeDefined();
      expect(result.snoozed_until).toBe('2025-01-20T10:00:00.000Z');
      expect(snoozeNotificationUseCase.execute).toHaveBeenCalledWith(
        'notification-123',
        mockUserId,
        expect.objectContaining({
          snoozedUntil: expect.any(Date),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        status: 'sent',
        isRead: true,
        readAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
      } as unknown as Notification;
      markNotificationAsReadUseCase.execute.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(mockRequest, 'notification-123');

      expect(result).toBeDefined();
      expect(result.read_at).toBeDefined();
      expect(markNotificationAsReadUseCase.execute).toHaveBeenCalledWith(
        'notification-123',
        mockUserId,
      );
    });
  });
});
