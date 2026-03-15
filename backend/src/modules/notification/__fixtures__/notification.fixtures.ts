import { Notification } from '../domain/notification.entity';
import { NotificationEntity } from '../infrastructure/persistence/notification.entity';

export function makeNotification(overrides: Record<string, any> = {}): Notification {
  return new Notification({
    id: 'notif-1',
    userId: 'user-1',
    type: 'reminder',
    channel: 'email',
    title: 'Payment Due',
    body: 'Your payment is due soon',
    status: 'pending',
    ...overrides,
  });
}

export function makeNotificationEntity(overrides: Record<string, any> = {}): NotificationEntity {
  return Object.assign(new NotificationEntity(), {
    id: 'notif-1',
    userId: 'user-1',
    type: 'reminder',
    channel: 'email',
    title: 'Payment Due',
    body: 'Your payment is due soon',
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  });
}
