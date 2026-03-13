import { getMetadataArgsStorage } from 'typeorm';
import { NotificationEntity } from './notification.entity';

describe('NotificationEntity (infra persistence)', () => {
  it('should create an instance', () => {
    const entity = new NotificationEntity();
    expect(entity).toBeInstanceOf(NotificationEntity);
  });

  it('should have all expected properties assignable', () => {
    const entity = new NotificationEntity();
    entity.id = 'notif-1';
    entity.userId = 'user-1';
    entity.eventId = 'event-1';
    entity.reminderId = 'reminder-1';
    entity.type = 'reminder';
    entity.channel = 'email';
    entity.title = 'Payment Due';
    entity.body = 'Your payment is due soon';
    entity.sentAt = new Date('2025-02-01T10:00:00.000Z');
    entity.readAt = new Date('2025-02-01T11:00:00.000Z');
    entity.status = 'sent';
    entity.snoozedUntil = new Date('2025-02-02T10:00:00.000Z');
    entity.errorMessage = 'Some error';
    entity.metadata = { key: 'value' };
    entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
    entity.deletedAt = new Date('2025-06-01T10:00:00.000Z');

    expect(entity.id).toBe('notif-1');
    expect(entity.userId).toBe('user-1');
    expect(entity.eventId).toBe('event-1');
    expect(entity.reminderId).toBe('reminder-1');
    expect(entity.type).toBe('reminder');
    expect(entity.channel).toBe('email');
    expect(entity.title).toBe('Payment Due');
    expect(entity.body).toBe('Your payment is due soon');
    expect(entity.sentAt).toEqual(new Date('2025-02-01T10:00:00.000Z'));
    expect(entity.readAt).toEqual(new Date('2025-02-01T11:00:00.000Z'));
    expect(entity.status).toBe('sent');
    expect(entity.snoozedUntil).toEqual(new Date('2025-02-02T10:00:00.000Z'));
    expect(entity.errorMessage).toBe('Some error');
    expect(entity.metadata).toEqual({ key: 'value' });
    expect(entity.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    expect(entity.deletedAt).toEqual(new Date('2025-06-01T10:00:00.000Z'));
  });

  it('should handle optional fields as undefined', () => {
    const entity = new NotificationEntity();
    expect(entity.eventId).toBeUndefined();
    expect(entity.reminderId).toBeUndefined();
    expect(entity.sentAt).toBeUndefined();
    expect(entity.readAt).toBeUndefined();
    expect(entity.snoozedUntil).toBeUndefined();
    expect(entity.errorMessage).toBeUndefined();
    expect(entity.metadata).toBeUndefined();
    expect(entity.deletedAt).toBeUndefined();
  });

  describe('TypeORM relation metadata', () => {
    it('should have ManyToOne relations for user and event', () => {
      const storage = getMetadataArgsStorage();
      const relations = storage.relations.filter((rel: any) => rel.target === NotificationEntity);
      expect(relations.length).toBeGreaterThanOrEqual(2);
      // Trigger the type functions to cover the lambda callbacks (lines 26, 33)
      relations.forEach((rel: any) => {
        const type = rel.type();
        expect(type).toBeDefined();
      });
    });
  });

  describe('optional relation fields', () => {
    it('should allow assigning user and event relation objects', () => {
      const entity = new NotificationEntity();
      entity.user = { id: 'user-1' } as any;
      entity.event = { id: 'event-1' } as any;
      expect(entity.user).toBeDefined();
      expect(entity.event).toBeDefined();
    });
  });
});
