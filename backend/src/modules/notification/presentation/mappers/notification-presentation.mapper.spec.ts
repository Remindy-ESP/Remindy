import { NotificationPresentationMapper } from './notification-presentation.mapper';
import { Notification } from '../../domain/notification.entity';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';

describe('NotificationPresentationMapper', () => {
  describe('toResponseDto', () => {
    it('should map Notification domain to NotificationResponseDto', () => {
      const notification = new Notification({
        id: 'notif-123',
        userId: 'user-123',
        eventId: 'event-123',
        reminderId: 'reminder-123',
        type: 'payment_due',
        channel: 'email',
        title: 'Payment Due',
        body: 'Your payment is due soon',
        sentAt: new Date('2025-02-01T10:00:00.000Z'),
        readAt: new Date('2025-02-01T11:00:00.000Z'),
        status: 'sent',
        snoozedUntil: new Date('2025-02-02T10:00:00.000Z'),
        errorMessage: undefined,
        metadata: { key: 'value' },
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        deletedAt: undefined,
      });

      const dto = NotificationPresentationMapper.toResponseDto(notification);

      expect(dto.id).toBe('notif-123');
      expect(dto.user_id).toBe('user-123');
      expect(dto.event_id).toBe('event-123');
      expect(dto.reminder_id).toBe('reminder-123');
      expect(dto.type).toBe('payment_due');
      expect(dto.channel).toBe('email');
      expect(dto.title).toBe('Payment Due');
      expect(dto.body).toBe('Your payment is due soon');
      expect(dto.sent_at).toBe('2025-02-01T10:00:00.000Z');
      expect(dto.read_at).toBe('2025-02-01T11:00:00.000Z');
      expect(dto.status).toBe('sent');
      expect(dto.snoozed_until).toBe('2025-02-02T10:00:00.000Z');
      expect(dto.metadata).toEqual({ key: 'value' });
      expect(dto.created_at).toBe('2025-01-01T10:00:00.000Z');
    });

    it('should map Notification without optional fields', () => {
      const notification = new Notification({
        id: 'notif-456',
        userId: 'user-456',
        type: 'payment_failed',
        channel: 'push',
        title: 'Payment Failed',
        body: 'Your payment has failed',
        status: 'failed',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });

      const dto = NotificationPresentationMapper.toResponseDto(notification);

      expect(dto.event_id).toBeUndefined();
      expect(dto.reminder_id).toBeUndefined();
      expect(dto.sent_at).toBeUndefined();
      expect(dto.read_at).toBeUndefined();
      expect(dto.snoozed_until).toBeUndefined();
      expect(dto.error_message).toBeUndefined();
      expect(dto.metadata).toBeUndefined();
      expect(dto.deleted_at).toBeUndefined();
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Notifications to array of NotificationResponseDto', () => {
      const notifications = [
        new Notification({
          id: 'notif-1',
          userId: 'user-1',
          type: 'payment_due',
          channel: 'email',
          title: 'Title 1',
          body: 'Body 1',
          status: 'sent',
          createdAt: new Date(),
        }),
        new Notification({
          id: 'notif-2',
          userId: 'user-2',
          type: 'payment_failed',
          channel: 'push',
          title: 'Title 2',
          body: 'Body 2',
          status: 'failed',
          createdAt: new Date(),
        }),
      ];

      const dtos = NotificationPresentationMapper.toResponseDtoArray(notifications);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('notif-1');
      expect(dtos[1].id).toBe('notif-2');
    });
  });

  describe('toFilterAppDto', () => {
    it('should map NotificationFilterDto to NotificationFilterAppDto with userId', () => {
      const filterDto: NotificationFilterDto = {
        type: 'payment_due',
        channel: 'email',
        status: 'sent',
        is_read: true,
        limit: 10,
        sort: 'created_at:asc',
      };

      const appDto = NotificationPresentationMapper.toFilterAppDto('user-123', filterDto);

      expect(appDto.userId).toBe('user-123');
      expect(appDto.type).toBe('payment_due');
      expect(appDto.channel).toBe('email');
      expect(appDto.status).toBe('sent');
      expect(appDto.isRead).toBe(true);
      expect(appDto.limit).toBe(10);
      expect(appDto.sort).toBe('created_at:asc');
    });

    it('should use default values when not provided', () => {
      const filterDto: NotificationFilterDto = {};

      const appDto = NotificationPresentationMapper.toFilterAppDto('user-456', filterDto);

      expect(appDto.userId).toBe('user-456');
      expect(appDto.limit).toBe(50);
      expect(appDto.sort).toBe('created_at:desc');
      expect(appDto.type).toBeUndefined();
      expect(appDto.channel).toBeUndefined();
      expect(appDto.status).toBeUndefined();
      expect(appDto.isRead).toBeUndefined();
    });
  });

  describe('toSnoozeAppDto', () => {
    it('should map SnoozeNotificationDto to SnoozeNotificationAppDto', () => {
      const snoozeDto: SnoozeNotificationDto = {
        snoozed_until: '2025-02-15T10:00:00.000Z',
      };

      const appDto = NotificationPresentationMapper.toSnoozeAppDto(snoozeDto);

      expect(appDto.snoozedUntil).toEqual(new Date('2025-02-15T10:00:00.000Z'));
    });
  });
});
