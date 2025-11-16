import { Notification } from '../../domain/notification.entity';
import { NotificationEntity } from '../persistence/notification.entity';

export class NotificationMapper {
  static toDomain(entity: NotificationEntity): Notification {
    const notification = new Notification({
      id: entity.id,
      userId: entity.userId,
      eventId: entity.eventId,
      reminderId: entity.reminderId,
      type: entity.type,
      channel: entity.channel,
      title: entity.title,
      body: entity.body,
      sentAt: entity.sentAt,
      readAt: entity.readAt,
      status: entity.status,
      snoozedUntil: entity.snoozedUntil,
      errorMessage: entity.errorMessage,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      deletedAt: entity.deletedAt,
    });

    return notification;
  }

  static toPersistence(notification: Notification): NotificationEntity {
    const entity = new NotificationEntity();

    if (notification.id) {
      entity.id = notification.id;
    }
    entity.userId = notification.userId;
    entity.eventId = notification.eventId;
    entity.reminderId = notification.reminderId;
    entity.type = notification.type;
    entity.channel = notification.channel;
    entity.title = notification.title;
    entity.body = notification.body;
    entity.sentAt = notification.sentAt;
    entity.readAt = notification.readAt;
    entity.status = notification.status;
    entity.snoozedUntil = notification.snoozedUntil;
    entity.errorMessage = notification.errorMessage;
    entity.metadata = notification.metadata;
    if (notification.createdAt) {
      entity.createdAt = notification.createdAt;
    }
    if (notification.deletedAt) {
      entity.deletedAt = notification.deletedAt;
    }

    return entity;
  }

  static toDomainArray(entities: NotificationEntity[]): Notification[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
