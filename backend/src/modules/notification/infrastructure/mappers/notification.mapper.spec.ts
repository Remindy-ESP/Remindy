import { NotificationMapper } from './notification.mapper';
import { Notification } from '../../domain/notification.entity';
import { NotificationEntity } from '../persistence/notification.entity';

describe('NotificationMapper', () => {
  describe('toDomain', () => {
    it('should map NotificationEntity to Notification domain with all fields', () => {
      const entity = new NotificationEntity();
      entity.id = 'notif-123';
      entity.userId = 'user-123';
      entity.eventId = 'event-123';
      entity.reminderId = 'reminder-123';
      entity.type = 'payment_due';
      entity.channel = 'email';
      entity.title = 'Payment Due';
      entity.body = 'Your payment is due soon';
      entity.sentAt = new Date('2025-02-01T10:00:00.000Z');
      entity.readAt = new Date('2025-02-01T11:00:00.000Z');
      entity.status = 'sent';
      entity.snoozedUntil = new Date('2025-02-02T10:00:00.000Z');
      entity.errorMessage = undefined;
      entity.metadata = { key: 'value' };
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.deletedAt = undefined;

      const domain = NotificationMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Notification);
      expect(domain.id).toBe(entity.id);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.eventId).toBe(entity.eventId);
      expect(domain.reminderId).toBe(entity.reminderId);
      expect(domain.type).toBe(entity.type);
      expect(domain.channel).toBe(entity.channel);
      expect(domain.title).toBe(entity.title);
      expect(domain.body).toBe(entity.body);
      expect(domain.sentAt).toEqual(entity.sentAt);
      expect(domain.readAt).toEqual(entity.readAt);
      expect(domain.status).toBe(entity.status);
      expect(domain.snoozedUntil).toEqual(entity.snoozedUntil);
      expect(domain.metadata).toEqual(entity.metadata);
      expect(domain.createdAt).toEqual(entity.createdAt);
    });

    it('should map NotificationEntity without optional fields', () => {
      const entity = new NotificationEntity();
      entity.id = 'notif-456';
      entity.userId = 'user-456';
      entity.type = 'payment_failed';
      entity.channel = 'push';
      entity.title = 'Payment Failed';
      entity.body = 'Your payment has failed';
      entity.status = 'pending';
      entity.createdAt = new Date();

      const domain = NotificationMapper.toDomain(entity);

      expect(domain.eventId).toBeUndefined();
      expect(domain.reminderId).toBeUndefined();
      expect(domain.sentAt).toBeUndefined();
      expect(domain.readAt).toBeUndefined();
      expect(domain.snoozedUntil).toBeUndefined();
      expect(domain.errorMessage).toBeUndefined();
      expect(domain.metadata).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should map Notification domain to NotificationEntity', () => {
      const domain = new Notification({
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
        metadata: { key: 'value' },
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });

      const entity = NotificationMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(NotificationEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.userId).toBe(domain.userId);
      expect(entity.eventId).toBe(domain.eventId);
      expect(entity.reminderId).toBe(domain.reminderId);
      expect(entity.type).toBe(domain.type);
      expect(entity.channel).toBe(domain.channel);
      expect(entity.title).toBe(domain.title);
      expect(entity.body).toBe(domain.body);
      expect(entity.sentAt).toEqual(domain.sentAt);
      expect(entity.readAt).toEqual(domain.readAt);
      expect(entity.status).toBe(domain.status);
      expect(entity.metadata).toEqual(domain.metadata);
      expect(entity.createdAt).toEqual(domain.createdAt);
    });

    it('should map Notification domain without id (new entity)', () => {
      const domain = new Notification({
        userId: 'user-456',
        type: 'subscription_renewal',
        channel: 'sms',
        title: 'Renewal Soon',
        body: 'Your subscription will renew',
        status: 'pending',
      });

      const entity = NotificationMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBe(domain.userId);
    });
  });

  describe('toDomainArray', () => {
    it('should map array of NotificationEntities to array of Notifications', () => {
      const entities = [
        Object.assign(new NotificationEntity(), {
          id: 'notif-1',
          userId: 'user-1',
          type: 'payment_due',
          channel: 'email',
          title: 'Title 1',
          body: 'Body 1',
          status: 'sent',
          createdAt: new Date(),
        }),
        Object.assign(new NotificationEntity(), {
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

      const domains = NotificationMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Notification);
      expect(domains[0].id).toBe('notif-1');
      expect(domains[1]).toBeInstanceOf(Notification);
      expect(domains[1].id).toBe('notif-2');
    });

    it('should return empty array when given empty array', () => {
      const domains = NotificationMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to persistence and back to domain', () => {
      const originalDomain = new Notification({
        id: 'notif-123',
        userId: 'user-123',
        eventId: 'event-123',
        type: 'payment_due',
        channel: 'email',
        title: 'Payment Due',
        body: 'Your payment is due soon',
        status: 'sent',
        sentAt: new Date('2025-02-01T10:00:00.000Z'),
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });

      const entity = NotificationMapper.toPersistence(originalDomain);
      const mappedDomain = NotificationMapper.toDomain(entity);

      expect(mappedDomain.id).toBe(originalDomain.id);
      expect(mappedDomain.userId).toBe(originalDomain.userId);
      expect(mappedDomain.type).toBe(originalDomain.type);
      expect(mappedDomain.channel).toBe(originalDomain.channel);
      expect(mappedDomain.status).toBe(originalDomain.status);
    });
  });
});
