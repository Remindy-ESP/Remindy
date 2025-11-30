import { EventMapper } from './event.mapper';
import { Event } from '../../domain/event.entity';
import { EventEntity } from '../persistence/event.entity';

describe('EventMapper', () => {
  describe('toDomain', () => {
    it('should map EventEntity to Event domain with all fields', () => {
      const entity = new EventEntity();
      entity.id = 'event-123';
      entity.subscriptionId = 'sub-123';
      entity.eventSeriesId = 'series-123';
      entity.title = 'Monthly Subscription';
      entity.amount = 29.99;
      entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
      entity.endsAt = new Date('2025-02-01T11:00:00.000Z');
      entity.status = 'scheduled';
      entity.paymentStatus = 'pending';
      entity.notes = 'Test notes';
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');

      const domain = EventMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Event);
      expect(domain.id).toBe(entity.id);
      expect(domain.subscriptionId).toBe(entity.subscriptionId);
      expect(domain.eventSeriesId).toBe(entity.eventSeriesId);
      expect(domain.title).toBe(entity.title);
      expect(domain.amount).toBe(entity.amount);
      expect(domain.startsAt).toEqual(entity.startsAt);
      expect(domain.endsAt).toEqual(entity.endsAt);
      expect(domain.status).toBe(entity.status);
      expect(domain.paymentStatus).toBe(entity.paymentStatus);
      expect(domain.notes).toBe(entity.notes);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
      expect(domain.deletedAt).toBeUndefined();
    });

    it('should map EventEntity with deletedAt', () => {
      const entity = new EventEntity();
      entity.id = 'event-456';
      entity.subscriptionId = 'sub-456';
      entity.title = 'Canceled Event';
      entity.amount = 19.99;
      entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
      entity.status = 'canceled';
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');
      entity.deletedAt = new Date('2025-01-03T10:00:00.000Z');

      const domain = EventMapper.toDomain(entity);

      expect(domain.deletedAt).toEqual(entity.deletedAt);
      expect(domain.status).toBe('canceled');
    });

    it('should map EventEntity without optional fields', () => {
      const entity = new EventEntity();
      entity.id = 'event-789';
      entity.subscriptionId = 'sub-789';
      entity.eventSeriesId = undefined;
      entity.title = 'Simple Event';
      entity.amount = 9.99;
      entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
      entity.endsAt = undefined;
      entity.status = 'scheduled';
      entity.paymentStatus = undefined;
      entity.notes = undefined;
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');

      const domain = EventMapper.toDomain(entity);

      expect(domain.eventSeriesId).toBeUndefined();
      expect(domain.endsAt).toBeUndefined();
      expect(domain.paymentStatus).toBeUndefined();
      expect(domain.notes).toBeUndefined();
    });

    it('should convert decimal amount to number', () => {
      const entity = new EventEntity();
      entity.id = 'event-999';
      entity.subscriptionId = 'sub-999';
      entity.title = 'Decimal Test';
      entity.amount = '49.95' as any; // Simulate Decimal type
      entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
      entity.status = 'scheduled';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      const domain = EventMapper.toDomain(entity);

      expect(typeof domain.amount).toBe('number');
      expect(domain.amount).toBe(49.95);
    });

    it('should map different event statuses', () => {
      const statuses: Array<'scheduled' | 'completed' | 'canceled' | 'failed'> = [
        'scheduled',
        'completed',
        'canceled',
        'failed',
      ];

      statuses.forEach(status => {
        const entity = new EventEntity();
        entity.id = `event-${status}`;
        entity.subscriptionId = 'sub-123';
        entity.title = `Event ${status}`;
        entity.amount = 29.99;
        entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
        entity.status = status;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();

        const domain = EventMapper.toDomain(entity);

        expect(domain.status).toBe(status);
      });
    });

    it('should map different payment statuses', () => {
      const paymentStatuses: Array<'pending' | 'paid' | 'failed'> = ['pending', 'paid', 'failed'];

      paymentStatuses.forEach(paymentStatus => {
        const entity = new EventEntity();
        entity.id = `event-${paymentStatus}`;
        entity.subscriptionId = 'sub-123';
        entity.title = `Event ${paymentStatus}`;
        entity.amount = 29.99;
        entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
        entity.status = 'completed';
        entity.paymentStatus = paymentStatus;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();

        const domain = EventMapper.toDomain(entity);

        expect(domain.paymentStatus).toBe(paymentStatus);
      });
    });
  });

  describe('toPersistence', () => {
    it('should map Event domain to EventEntity with all fields', () => {
      const domain = new Event({
        id: 'event-123',
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-123',
        title: 'Monthly Subscription',
        amount: 29.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        endsAt: new Date('2025-02-01T11:00:00.000Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = EventMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(EventEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.subscriptionId).toBe(domain.subscriptionId);
      expect(entity.eventSeriesId).toBe(domain.eventSeriesId);
      expect(entity.title).toBe(domain.title);
      expect(entity.amount).toBe(domain.amount);
      expect(entity.startsAt).toEqual(domain.startsAt);
      expect(entity.endsAt).toEqual(domain.endsAt);
      expect(entity.status).toBe(domain.status);
      expect(entity.paymentStatus).toBe(domain.paymentStatus);
      expect(entity.notes).toBe(domain.notes);
      expect(entity.createdAt).toEqual(domain.createdAt);
      expect(entity.updatedAt).toEqual(domain.updatedAt);
    });

    it('should map Event domain without id (new entity)', () => {
      const domain = new Event({
        subscriptionId: 'sub-456',
        title: 'New Event',
        amount: 19.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'scheduled',
      });

      const entity = EventMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.subscriptionId).toBe(domain.subscriptionId);
      expect(entity.title).toBe(domain.title);
    });

    it('should map Event domain with deletedAt', () => {
      const domain = new Event({
        id: 'event-789',
        subscriptionId: 'sub-789',
        title: 'Deleted Event',
        amount: 9.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'canceled',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
        deletedAt: new Date('2025-01-03T10:00:00.000Z'),
      });

      const entity = EventMapper.toPersistence(domain);

      expect(entity.deletedAt).toEqual(domain.deletedAt);
    });

    it('should map Event domain without optional fields', () => {
      const domain = new Event({
        id: 'event-999',
        subscriptionId: 'sub-999',
        title: 'Minimal Event',
        amount: 5.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'scheduled',
      });

      const entity = EventMapper.toPersistence(domain);

      expect(entity.eventSeriesId).toBeUndefined();
      expect(entity.endsAt).toBeUndefined();
      expect(entity.paymentStatus).toBeUndefined();
      expect(entity.notes).toBeUndefined();
      expect(entity.deletedAt).toBeUndefined();
    });

    it('should map Event domain without createdAt and updatedAt', () => {
      const domain = new Event({
        subscriptionId: 'sub-123',
        title: 'Event Without Timestamps',
        amount: 15.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'scheduled',
      });

      const entity = EventMapper.toPersistence(domain);

      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should map different event statuses', () => {
      const statuses: Array<'scheduled' | 'completed' | 'canceled' | 'failed'> = [
        'scheduled',
        'completed',
        'canceled',
        'failed',
      ];

      statuses.forEach(status => {
        const domain = new Event({
          id: `event-${status}`,
          subscriptionId: 'sub-123',
          title: `Event ${status}`,
          amount: 29.99,
          startsAt: new Date('2025-02-01T10:00:00.000Z'),
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const entity = EventMapper.toPersistence(domain);

        expect(entity.status).toBe(status);
      });
    });

    it('should map different payment statuses', () => {
      const paymentStatuses: Array<'pending' | 'paid' | 'failed' | undefined> = [
        'pending',
        'paid',
        'failed',
        undefined,
      ];

      paymentStatuses.forEach(paymentStatus => {
        const domain = new Event({
          id: `event-${paymentStatus || 'none'}`,
          subscriptionId: 'sub-123',
          title: `Event ${paymentStatus || 'none'}`,
          amount: 29.99,
          startsAt: new Date('2025-02-01T10:00:00.000Z'),
          status: 'completed',
          paymentStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const entity = EventMapper.toPersistence(domain);

        expect(entity.paymentStatus).toBe(paymentStatus);
      });
    });
  });

  describe('toDomainArray', () => {
    it('should map array of EventEntities to array of Events', () => {
      const entities = [
        Object.assign(new EventEntity(), {
          id: 'event-1',
          subscriptionId: 'sub-1',
          title: 'Event 1',
          amount: 19.99,
          startsAt: new Date('2025-02-01T10:00:00.000Z'),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventEntity(), {
          id: 'event-2',
          subscriptionId: 'sub-2',
          title: 'Event 2',
          amount: 29.99,
          startsAt: new Date('2025-02-02T10:00:00.000Z'),
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = EventMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Event);
      expect(domains[0].id).toBe('event-1');
      expect(domains[1]).toBeInstanceOf(Event);
      expect(domains[1].id).toBe('event-2');
    });

    it('should return empty array when given empty array', () => {
      const domains = EventMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });

    it('should map array with different event statuses', () => {
      const entities = [
        Object.assign(new EventEntity(), {
          id: 'event-1',
          subscriptionId: 'sub-1',
          title: 'Scheduled Event',
          amount: 19.99,
          startsAt: new Date('2025-02-01T10:00:00.000Z'),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventEntity(), {
          id: 'event-2',
          subscriptionId: 'sub-2',
          title: 'Completed Event',
          amount: 29.99,
          startsAt: new Date('2025-02-02T10:00:00.000Z'),
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventEntity(), {
          id: 'event-3',
          subscriptionId: 'sub-3',
          title: 'Canceled Event',
          amount: 39.99,
          startsAt: new Date('2025-02-03T10:00:00.000Z'),
          status: 'canceled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = EventMapper.toDomainArray(entities);

      expect(domains).toHaveLength(3);
      expect(domains.map(d => d.status)).toEqual(['scheduled', 'completed', 'canceled']);
    });

    it('should map array with events with and without optional fields', () => {
      const entities = [
        Object.assign(new EventEntity(), {
          id: 'event-1',
          subscriptionId: 'sub-1',
          eventSeriesId: 'series-1',
          title: 'Event with Series',
          amount: 19.99,
          startsAt: new Date('2025-02-01T10:00:00.000Z'),
          endsAt: new Date('2025-02-01T11:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
          notes: 'Has notes',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventEntity(), {
          id: 'event-2',
          subscriptionId: 'sub-2',
          title: 'Event without Series',
          amount: 29.99,
          startsAt: new Date('2025-02-02T10:00:00.000Z'),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = EventMapper.toDomainArray(entities);

      expect(domains[0].eventSeriesId).toBe('series-1');
      expect(domains[0].endsAt).toBeDefined();
      expect(domains[0].paymentStatus).toBe('pending');
      expect(domains[0].notes).toBe('Has notes');

      expect(domains[1].eventSeriesId).toBeUndefined();
      expect(domains[1].endsAt).toBeUndefined();
      expect(domains[1].paymentStatus).toBeUndefined();
      expect(domains[1].notes).toBeUndefined();
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to persistence and back to domain', () => {
      const originalDomain = new Event({
        id: 'event-123',
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-123',
        title: 'Monthly Subscription',
        amount: 29.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        endsAt: new Date('2025-02-01T11:00:00.000Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = EventMapper.toPersistence(originalDomain);
      const mappedDomain = EventMapper.toDomain(entity);

      expect(mappedDomain.id).toBe(originalDomain.id);
      expect(mappedDomain.subscriptionId).toBe(originalDomain.subscriptionId);
      expect(mappedDomain.eventSeriesId).toBe(originalDomain.eventSeriesId);
      expect(mappedDomain.title).toBe(originalDomain.title);
      expect(mappedDomain.amount).toBe(originalDomain.amount);
      expect(mappedDomain.startsAt).toEqual(originalDomain.startsAt);
      expect(mappedDomain.endsAt).toEqual(originalDomain.endsAt);
      expect(mappedDomain.status).toBe(originalDomain.status);
      expect(mappedDomain.paymentStatus).toBe(originalDomain.paymentStatus);
      expect(mappedDomain.notes).toBe(originalDomain.notes);
    });

    it('should maintain data integrity for event without optional fields', () => {
      const originalDomain = new Event({
        id: 'event-456',
        subscriptionId: 'sub-456',
        title: 'Simple Event',
        amount: 19.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'scheduled',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = EventMapper.toPersistence(originalDomain);
      const mappedDomain = EventMapper.toDomain(entity);

      expect(mappedDomain.eventSeriesId).toBeUndefined();
      expect(mappedDomain.endsAt).toBeUndefined();
      expect(mappedDomain.paymentStatus).toBeUndefined();
      expect(mappedDomain.notes).toBeUndefined();
    });

    it('should maintain data integrity for deleted event', () => {
      const originalDomain = new Event({
        id: 'event-789',
        subscriptionId: 'sub-789',
        title: 'Deleted Event',
        amount: 9.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'canceled',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
        deletedAt: new Date('2025-01-03T10:00:00.000Z'),
      });

      const entity = EventMapper.toPersistence(originalDomain);
      const mappedDomain = EventMapper.toDomain(entity);

      expect(mappedDomain.deletedAt).toEqual(originalDomain.deletedAt);
      expect(mappedDomain.status).toBe('canceled');
    });

    it('should maintain decimal precision for amount', () => {
      const originalDomain = new Event({
        id: 'event-999',
        subscriptionId: 'sub-999',
        title: 'Precise Amount',
        amount: 123.456,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const entity = EventMapper.toPersistence(originalDomain);
      const mappedDomain = EventMapper.toDomain(entity);

      expect(mappedDomain.amount).toBe(originalDomain.amount);
    });
  });
});
