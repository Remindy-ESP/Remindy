import { Notification } from '../../domain/notification.entity';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { NotificationFilterAppDto } from '../../application/dto/notification-filter-app.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';
import { SnoozeNotificationAppDto } from '../../application/dto/snooze-notification-app.dto';

export class NotificationPresentationMapper {
  static toResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id!,
      user_id: notification.userId,
      event_id: notification.eventId,
      reminder_id: notification.reminderId,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      body: notification.body,
      sent_at: notification.sentAt?.toISOString(),
      read_at: notification.readAt?.toISOString(),
      status: notification.status,
      snoozed_until: notification.snoozedUntil?.toISOString(),
      error_message: notification.errorMessage,
      metadata: notification.metadata,
      created_at: notification.createdAt!.toISOString(),
      deleted_at: notification.deletedAt?.toISOString(),
    };
  }

  static toResponseDtoArray(notifications: Notification[]): NotificationResponseDto[] {
    return notifications.map(notification => this.toResponseDto(notification));
  }

  static toFilterAppDto(userId: string, dto: NotificationFilterDto): NotificationFilterAppDto {
    return {
      userId,
      type: dto.type,
      channel: dto.channel,
      status: dto.status,
      isRead: dto.is_read,
      limit: dto.limit ?? 50,
      sort: dto.sort ?? 'created_at:desc',
    };
  }

  static toSnoozeAppDto(dto: SnoozeNotificationDto): SnoozeNotificationAppDto {
    return {
      snoozedUntil: new Date(dto.snoozed_until),
    };
  }
}
