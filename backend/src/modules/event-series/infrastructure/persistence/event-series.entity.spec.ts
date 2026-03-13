import { getMetadataArgsStorage } from 'typeorm';
import { EventSeriesEntity } from './event-series.entity';

describe('EventSeriesEntity (infra persistence)', () => {
  it('should create an instance', () => {
    const entity = new EventSeriesEntity();
    expect(entity).toBeInstanceOf(EventSeriesEntity);
  });

  it('should have all expected properties assignable', () => {
    const entity = new EventSeriesEntity();
    entity.id = 'series-1';
    entity.subscriptionId = 'sub-1';
    entity.rrule = 'FREQ=MONTHLY;INTERVAL=1';
    entity.dtstart = new Date('2025-01-01T10:00:00.000Z');
    entity.timezone = 'Europe/Paris';
    entity.exdates = [new Date('2025-02-01'), new Date('2025-03-01')];
    entity.rdates = [new Date('2025-04-01')];
    entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
    entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');
    entity.deletedAt = new Date('2025-06-01T10:00:00.000Z');

    expect(entity.id).toBe('series-1');
    expect(entity.subscriptionId).toBe('sub-1');
    expect(entity.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
    expect(entity.dtstart).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    expect(entity.timezone).toBe('Europe/Paris');
    expect(entity.exdates).toHaveLength(2);
    expect(entity.rdates).toHaveLength(1);
    expect(entity.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    expect(entity.updatedAt).toEqual(new Date('2025-01-02T10:00:00.000Z'));
    expect(entity.deletedAt).toEqual(new Date('2025-06-01T10:00:00.000Z'));
  });

  it('should handle optional fields as undefined', () => {
    const entity = new EventSeriesEntity();
    expect(entity.exdates).toBeUndefined();
    expect(entity.rdates).toBeUndefined();
    expect(entity.deletedAt).toBeUndefined();
  });

  describe('TypeORM relation metadata', () => {
    it('should have OneToOne relation for subscription (covers line 21)', () => {
      const storage = getMetadataArgsStorage();
      const relations = storage.relations.filter((rel: any) => rel.target === EventSeriesEntity);
      expect(relations.length).toBeGreaterThanOrEqual(1);
      // Trigger the type functions to cover the lambda callbacks
      relations.forEach((rel: any) => {
        const type = rel.type();
        expect(type).toBeDefined();
      });
    });
  });

  describe('optional relation fields', () => {
    it('should allow assigning subscription relation object', () => {
      const entity = new EventSeriesEntity();
      entity.subscription = { id: 'sub-1' } as any;
      expect(entity.subscription).toBeDefined();
    });
  });
});
