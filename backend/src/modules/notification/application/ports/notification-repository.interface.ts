import { Notification } from '../../domain/notification.entity';
import { NotificationFilterAppDto } from '../dto/notification-filter-app.dto';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findAll(filters: NotificationFilterAppDto): Promise<Notification[]>;
  update(id: string, notification: Notification): Promise<Notification | null>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
