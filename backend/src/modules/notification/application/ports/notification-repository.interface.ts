import { Notification } from '../../domain/notification.entity';
import { NotificationFilterAppDto } from '../dto/notification-filter-app.dto';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findAll(filters: NotificationFilterAppDto): Promise<Notification[]>;
  findByUserAndMetadata(
    userId: string,
    type: string,
    subscriptionId: string,
    nextDueDate: string,
  ): Promise<Notification | null>;
  save(notification: Notification): Promise<Notification>;
  update(id: string, notification: Notification): Promise<Notification | null>;
  delete(id: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
