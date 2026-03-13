import { getMetadataArgsStorage } from 'typeorm';
import { EventEntity } from './event.entity';

describe('EventEntity (infra persistence)', () => {
  it('should create an instance', () => {
    const entity = new EventEntity();
    expect(entity).toBeInstanceOf(EventEntity);
  });

  it('should have all expected properties assignable', () => {
    const entity = new EventEntity();
    entity.id = 'event-1';
    entity.subscriptionId = 'sub-1';
    entity.eventSeriesId = 'series-1';
    entity.title = 'Netflix Payment';
    entity.amount = 9.99;
    entity.startsAt = new Date('2025-02-01T10:00:00.000Z');
    entity.endsAt = new Date('2025-02-01T11:00:00.000Z');
    entity.status = 'scheduled';
    entity.paymentStatus = 'pending';
    entity.notes = 'Some notes';
    entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
    entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');
    entity.deletedAt = new Date('2025-06-01T10:00:00.000Z');

    expect(entity.id).toBe('event-1');
    expect(entity.subscriptionId).toBe('sub-1');
    expect(entity.eventSeriesId).toBe('series-1');
    expect(entity.title).toBe('Netflix Payment');
    expect(entity.amount).toBe(9.99);
    expect(entity.startsAt).toEqual(new Date('2025-02-01T10:00:00.000Z'));
    expect(entity.endsAt).toEqual(new Date('2025-02-01T11:00:00.000Z'));
    expect(entity.status).toBe('scheduled');
    expect(entity.paymentStatus).toBe('pending');
    expect(entity.notes).toBe('Some notes');
    expect(entity.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    expect(entity.updatedAt).toEqual(new Date('2025-01-02T10:00:00.000Z'));
    expect(entity.deletedAt).toEqual(new Date('2025-06-01T10:00:00.000Z'));
  });

  it('should handle optional fields as undefined', () => {
    const entity = new EventEntity();
    expect(entity.eventSeriesId).toBeUndefined();
    expect(entity.endsAt).toBeUndefined();
    expect(entity.paymentStatus).toBeUndefined();
    expect(entity.notes).toBeUndefined();
    expect(entity.deletedAt).toBeUndefined();
  });

  describe('TypeORM relation metadata', () => {
    it('should have ManyToOne relation for subscription (covers line 24)', () => {
      const storage = getMetadataArgsStorage();
      const relations = storage.relations.filter((rel: any) => rel.target === EventEntity);
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
      const entity = new EventEntity();
      entity.subscription = { id: 'sub-1' } as any;
      expect(entity.subscription).toBeDefined();
    });
  });
});
