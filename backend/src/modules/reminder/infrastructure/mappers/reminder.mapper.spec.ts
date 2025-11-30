import { ReminderMapper } from './reminder.mapper';
import { Reminder } from '../../domain/reminder.entity';
import { ReminderEntity } from '../persistence/reminder.entity';

describe('ReminderMapper', () => {
  describe('toDomain', () => {
    it('should map ReminderEntity to Reminder domain', () => {
      const entity = new ReminderEntity();
      entity.id = 'reminder-123';
      entity.userId = 'user-123';
      entity.subscriptionId = 'sub-123';
      entity.type = 'payment_due';
      entity.daysBefore = 3;
      entity.enabled = true;
      entity.channel = 'email';
      entity.createdAt = new Date('2025-01-01');
      entity.updatedAt = new Date('2025-01-02');

      const domain = ReminderMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Reminder);
      expect(domain.id).toBe(entity.id);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.subscriptionId).toBe(entity.subscriptionId);
      expect(domain.type).toBe(entity.type);
      expect(domain.daysBefore).toBe(entity.daysBefore);
      expect(domain.enabled).toBe(entity.enabled);
      expect(domain.channel).toBe(entity.channel);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
    });

    it('should map ReminderEntity with deletedAt to domain', () => {
      const entity = new ReminderEntity();
      entity.id = 'reminder-456';
      entity.userId = 'user-456';
      entity.type = 'payment_failed';
      entity.daysBefore = 1;
      entity.enabled = false;
      entity.channel = 'push';
      entity.createdAt = new Date('2025-01-01');
      entity.updatedAt = new Date('2025-01-02');
      entity.deletedAt = new Date('2025-01-03');

      const domain = ReminderMapper.toDomain(entity);

      expect(domain.deletedAt).toEqual(entity.deletedAt);
    });

    it('should map ReminderEntity without subscriptionId', () => {
      const entity = new ReminderEntity();
      entity.id = 'reminder-789';
      entity.userId = 'user-789';
      entity.subscriptionId = undefined;
      entity.type = 'budget_alert';
      entity.daysBefore = 5;
      entity.enabled = true;
      entity.channel = 'email';
      entity.createdAt = new Date('2025-01-01');
      entity.updatedAt = new Date('2025-01-02');

      const domain = ReminderMapper.toDomain(entity);

      expect(domain.subscriptionId).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should map Reminder domain to ReminderEntity', () => {
      const domain = new Reminder({
        id: 'reminder-123',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });

      const entity = ReminderMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(ReminderEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.userId).toBe(domain.userId);
      expect(entity.subscriptionId).toBe(domain.subscriptionId);
      expect(entity.type).toBe(domain.type);
      expect(entity.daysBefore).toBe(domain.daysBefore);
      expect(entity.enabled).toBe(domain.enabled);
      expect(entity.channel).toBe(domain.channel);
      expect(entity.createdAt).toEqual(domain.createdAt);
      expect(entity.updatedAt).toEqual(domain.updatedAt);
    });

    it('should map Reminder domain without id (new entity)', () => {
      const domain = new Reminder({
        userId: 'user-456',
        subscriptionId: 'sub-456',
        type: 'subscription_renewal',
        daysBefore: 7,
        enabled: true,
        channel: 'sms',
      });

      const entity = ReminderMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBe(domain.userId);
    });

    it('should map Reminder domain with deletedAt', () => {
      const domain = new Reminder({
        id: 'reminder-789',
        userId: 'user-789',
        type: 'payment_due',
        daysBefore: 1,
        enabled: false,
        channel: 'email',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        deletedAt: new Date('2025-01-03'),
      });

      const entity = ReminderMapper.toPersistence(domain);

      expect(entity.deletedAt).toEqual(domain.deletedAt);
    });

    it('should map Reminder domain without subscriptionId', () => {
      const domain = new Reminder({
        id: 'reminder-999',
        userId: 'user-999',
        subscriptionId: undefined,
        type: 'budget_alert',
        daysBefore: 5,
        enabled: true,
        channel: 'push',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });

      const entity = ReminderMapper.toPersistence(domain);

      expect(entity.subscriptionId).toBeUndefined();
    });
  });

  describe('toDomainArray', () => {
    it('should map array of ReminderEntities to array of Reminders', () => {
      const entities = [
        Object.assign(new ReminderEntity(), {
          id: 'reminder-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          channel: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new ReminderEntity(), {
          id: 'reminder-2',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          type: 'payment_failed',
          daysBefore: 1,
          enabled: false,
          channel: 'push',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = ReminderMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Reminder);
      expect(domains[0].id).toBe('reminder-1');
      expect(domains[1]).toBeInstanceOf(Reminder);
      expect(domains[1].id).toBe('reminder-2');
    });

    it('should return empty array when given empty array', () => {
      const domains = ReminderMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });

    it('should map array with different reminder types', () => {
      const entities = [
        Object.assign(new ReminderEntity(), {
          id: 'reminder-1',
          userId: 'user-1',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          channel: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new ReminderEntity(), {
          id: 'reminder-2',
          userId: 'user-2',
          type: 'subscription_renewal',
          daysBefore: 14,
          enabled: true,
          channel: 'sms',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new ReminderEntity(), {
          id: 'reminder-3',
          userId: 'user-3',
          type: 'budget_alert',
          daysBefore: 5,
          enabled: true,
          channel: 'push',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = ReminderMapper.toDomainArray(entities);

      expect(domains).toHaveLength(3);
      expect(domains.map(d => d.type)).toEqual([
        'payment_due',
        'subscription_renewal',
        'budget_alert',
      ]);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to persistence and back to domain', () => {
      const originalDomain = new Reminder({
        id: 'reminder-123',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });

      const entity = ReminderMapper.toPersistence(originalDomain);
      const mappedDomain = ReminderMapper.toDomain(entity);

      expect(mappedDomain.id).toBe(originalDomain.id);
      expect(mappedDomain.userId).toBe(originalDomain.userId);
      expect(mappedDomain.subscriptionId).toBe(originalDomain.subscriptionId);
      expect(mappedDomain.type).toBe(originalDomain.type);
      expect(mappedDomain.daysBefore).toBe(originalDomain.daysBefore);
      expect(mappedDomain.enabled).toBe(originalDomain.enabled);
      expect(mappedDomain.channel).toBe(originalDomain.channel);
    });

    it('should maintain data integrity for reminder without subscriptionId', () => {
      const originalDomain = new Reminder({
        id: 'reminder-456',
        userId: 'user-456',
        subscriptionId: undefined,
        type: 'budget_alert',
        daysBefore: 5,
        enabled: true,
        channel: 'push',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });

      const entity = ReminderMapper.toPersistence(originalDomain);
      const mappedDomain = ReminderMapper.toDomain(entity);

      expect(mappedDomain.subscriptionId).toBeUndefined();
      expect(mappedDomain.type).toBe('budget_alert');
    });
  });
});
