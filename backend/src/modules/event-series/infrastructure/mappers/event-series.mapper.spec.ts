import { EventSeriesMapper } from './event-series.mapper';
import { EventSeries } from '../../domain/event-series.entity';
import { EventSeriesEntity } from '../persistence/event-series.entity';

describe('EventSeriesMapper', () => {
  describe('toDomain', () => {
    it('should map EventSeriesEntity to EventSeries domain', () => {
      const entity = new EventSeriesEntity();
      entity.id = 'series-123';
      entity.subscriptionId = 'sub-123';
      entity.rrule = 'FREQ=MONTHLY;INTERVAL=1';
      entity.dtstart = new Date('2025-01-01T10:00:00.000Z');
      entity.timezone = 'Europe/Paris';
      entity.exdates = [new Date('2025-02-01'), new Date('2025-03-01')];
      entity.rdates = [new Date('2025-04-01')];
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');

      const domain = EventSeriesMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(EventSeries);
      expect(domain.id).toBe(entity.id);
      expect(domain.subscriptionId).toBe(entity.subscriptionId);
      expect(domain.rrule).toBe(entity.rrule);
      expect(domain.dtstart).toEqual(entity.dtstart);
      expect(domain.timezone).toBe(entity.timezone);
      expect(domain.exdates).toEqual(entity.exdates);
      expect(domain.rdates).toEqual(entity.rdates);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
    });

    it('should map EventSeriesEntity without optional fields', () => {
      const entity = new EventSeriesEntity();
      entity.id = 'series-456';
      entity.subscriptionId = 'sub-456';
      entity.rrule = 'FREQ=WEEKLY;INTERVAL=2';
      entity.dtstart = new Date('2025-01-01T10:00:00.000Z');
      entity.timezone = 'UTC';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      const domain = EventSeriesMapper.toDomain(entity);

      expect(domain.exdates).toBeUndefined();
      expect(domain.rdates).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should map EventSeries domain to EventSeriesEntity', () => {
      const domain = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: [new Date('2025-02-01'), new Date('2025-03-01')],
        rdates: [new Date('2025-04-01')],
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = EventSeriesMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(EventSeriesEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.subscriptionId).toBe(domain.subscriptionId);
      expect(entity.rrule).toBe(domain.rrule);
      expect(entity.dtstart).toEqual(domain.dtstart);
      expect(entity.timezone).toBe(domain.timezone);
      expect(entity.exdates).toEqual(domain.exdates);
      expect(entity.rdates).toEqual(domain.rdates);
      expect(entity.createdAt).toEqual(domain.createdAt);
      expect(entity.updatedAt).toEqual(domain.updatedAt);
    });

    it('should map EventSeries domain without id (new entity)', () => {
      const domain = new EventSeries({
        subscriptionId: 'sub-456',
        rrule: 'FREQ=WEEKLY',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'UTC',
      });

      const entity = EventSeriesMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.subscriptionId).toBe(domain.subscriptionId);
    });

    it('should map EventSeries domain with deletedAt set (covers deletedAt branch)', () => {
      const domain = new EventSeries({
        id: 'series-deleted',
        subscriptionId: 'sub-789',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
        deletedAt: new Date('2025-03-01T10:00:00.000Z'),
      });

      const entity = EventSeriesMapper.toPersistence(domain);

      expect(entity.deletedAt).toEqual(new Date('2025-03-01T10:00:00.000Z'));
    });
  });

  describe('toDomainArray', () => {
    it('should map array of EventSeriesEntities to array of EventSeries', () => {
      const entities = [
        Object.assign(new EventSeriesEntity(), {
          id: 'series-1',
          subscriptionId: 'sub-1',
          rrule: 'FREQ=MONTHLY',
          dtstart: new Date(),
          timezone: 'UTC',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventSeriesEntity(), {
          id: 'series-2',
          subscriptionId: 'sub-2',
          rrule: 'FREQ=WEEKLY',
          dtstart: new Date(),
          timezone: 'Europe/Paris',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = EventSeriesMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(EventSeries);
      expect(domains[0].id).toBe('series-1');
      expect(domains[1]).toBeInstanceOf(EventSeries);
      expect(domains[1].id).toBe('series-2');
    });

    it('should return empty array when given empty array', () => {
      const domains = EventSeriesMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to persistence and back to domain', () => {
      const originalDomain = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: [new Date('2025-02-01')],
        rdates: [new Date('2025-04-01')],
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = EventSeriesMapper.toPersistence(originalDomain);
      const mappedDomain = EventSeriesMapper.toDomain(entity);

      expect(mappedDomain.id).toBe(originalDomain.id);
      expect(mappedDomain.subscriptionId).toBe(originalDomain.subscriptionId);
      expect(mappedDomain.rrule).toBe(originalDomain.rrule);
      expect(mappedDomain.timezone).toBe(originalDomain.timezone);
    });
  });
});
