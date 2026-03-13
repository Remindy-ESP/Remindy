import { getMetadataArgsStorage } from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

describe('SubscriptionEntity (infra persistence)', () => {
  it('should create an instance with default values', () => {
    const entity = new SubscriptionEntity();
    expect(entity).toBeInstanceOf(SubscriptionEntity);
  });

  it('should have all expected properties assignable', () => {
    const entity = new SubscriptionEntity();
    entity.id = 'sub-1';
    entity.userId = 'user-1';
    entity.contractId = 42;
    entity.categoryId = 'cat-1';
    entity.name = 'Netflix';
    entity.amount = 9.99;
    entity.currency = 'EUR';
    entity.frequency = 'monthly';
    entity.startDate = new Date('2025-01-01');
    entity.endDate = new Date('2026-01-01');
    entity.nextDueDate = new Date('2025-02-01');
    entity.trialStartDate = new Date('2024-12-01');
    entity.trialEndDate = new Date('2024-12-31');
    entity.status = 'active';
    entity.color = '#FF0000';
    entity.notes = 'Some notes';
    entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
    entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');
    entity.deletedAt = new Date('2025-06-01T10:00:00.000Z');

    expect(entity.id).toBe('sub-1');
    expect(entity.userId).toBe('user-1');
    expect(entity.contractId).toBe(42);
    expect(entity.categoryId).toBe('cat-1');
    expect(entity.name).toBe('Netflix');
    expect(entity.amount).toBe(9.99);
    expect(entity.currency).toBe('EUR');
    expect(entity.frequency).toBe('monthly');
    expect(entity.startDate).toEqual(new Date('2025-01-01'));
    expect(entity.endDate).toEqual(new Date('2026-01-01'));
    expect(entity.nextDueDate).toEqual(new Date('2025-02-01'));
    expect(entity.trialStartDate).toEqual(new Date('2024-12-01'));
    expect(entity.trialEndDate).toEqual(new Date('2024-12-31'));
    expect(entity.status).toBe('active');
    expect(entity.color).toBe('#FF0000');
    expect(entity.notes).toBe('Some notes');
    expect(entity.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    expect(entity.updatedAt).toEqual(new Date('2025-01-02T10:00:00.000Z'));
    expect(entity.deletedAt).toEqual(new Date('2025-06-01T10:00:00.000Z'));
  });

  it('should return false for isTrialActive when trialEndDate is undefined', () => {
    const entity = new SubscriptionEntity();
    entity.trialEndDate = undefined;
    expect(entity.isTrialActive).toBe(false);
  });

  it('should return false for isTrialActive when trialEndDate is in the past', () => {
    const entity = new SubscriptionEntity();
    entity.trialEndDate = new Date('2020-01-01');
    expect(entity.isTrialActive).toBe(false);
  });

  it('should return true for isTrialActive when trialEndDate is in the future', () => {
    const entity = new SubscriptionEntity();
    entity.trialEndDate = new Date('2099-01-01');
    expect(entity.isTrialActive).toBe(true);
  });

  it('should handle optional fields as undefined', () => {
    const entity = new SubscriptionEntity();
    expect(entity.contractId).toBeUndefined();
    expect(entity.categoryId).toBeUndefined();
    expect(entity.endDate).toBeUndefined();
    expect(entity.trialStartDate).toBeUndefined();
    expect(entity.trialEndDate).toBeUndefined();
    expect(entity.color).toBeUndefined();
    expect(entity.notes).toBeUndefined();
    expect(entity.deletedAt).toBeUndefined();
  });

  describe('TypeORM column transformer functions', () => {
    let dateColumnTransformers: Array<{ to: Function; from: Function }>;

    beforeEach(() => {
      const storage = getMetadataArgsStorage();
      const columnArgs = storage.columns.filter(
        (col: any) => col.target === SubscriptionEntity && col.options?.transformer,
      );
      dateColumnTransformers = columnArgs.map((col: any) => col.options.transformer);
    });

    it('transformer.to returns the value as-is for a Date', () => {
      const date = new Date('2025-01-15');
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.to(date)).toBe(date);
      });
    });

    it('transformer.to returns the value as-is for a string', () => {
      const str = '2025-01-15';
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.to(str)).toBe(str);
      });
    });

    it('transformer.from returns ISO string when value has toISOString', () => {
      const date = new Date('2025-01-15T00:00:00.000Z');
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.from(date)).toBe('2025-01-15T00:00:00.000Z');
      });
    });

    it('transformer.from returns the value as-is when toISOString is not available (null)', () => {
      const nullValue = null as any;
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.from(nullValue)).toBeNull();
      });
    });

    it('transformer.from returns the value as-is when toISOString is not available (undefined)', () => {
      const undefinedValue = undefined as any;
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.from(undefinedValue)).toBeUndefined();
      });
    });

    it('transformer.from returns the value as-is when value has no toISOString (plain object)', () => {
      const plainObj = { notADate: true } as any;
      dateColumnTransformers.forEach(transformer => {
        expect(transformer.from(plainObj)).toBe(plainObj);
      });
    });

    it('transformer.from returns the fallback when toISOString returns empty', () => {
      // Test the || branch: when toISOString returns falsy, value itself is returned
      const fakeDate = { toISOString: () => '' } as any;
      dateColumnTransformers.forEach(transformer => {
        // '' is falsy, so || value will return the fakeDate object
        expect(transformer.from(fakeDate)).toBe(fakeDate);
      });
    });
  });

  describe('TypeORM relation metadata', () => {
    it('should have ManyToOne relations for user, contract, and category', () => {
      const storage = getMetadataArgsStorage();
      const relations = storage.relations.filter(
        (rel: any) => rel.target === SubscriptionEntity,
      );
      // There should be 3 ManyToOne relations
      expect(relations.length).toBeGreaterThanOrEqual(3);
      // Trigger the type functions to cover the lambda callbacks
      relations.forEach((rel: any) => {
        const type = rel.type();
        expect(type).toBeDefined();
      });
    });
  });

  describe('optional relation and property fields', () => {
    it('should allow assigning relation objects', () => {
      const entity = new SubscriptionEntity();
      // user relation
      entity.user = { id: 'user-1' } as any;
      expect(entity.user).toBeDefined();
      // contract relation (optional)
      entity.contract = { id: 1 } as any;
      expect(entity.contract).toBeDefined();
      // category relation (optional)
      entity.category = { id: 'cat-1' } as any;
      expect(entity.category).toBeDefined();
    });

    it('should allow accessing endDate and trialStartDate and trialEndDate when set', () => {
      const entity = new SubscriptionEntity();
      entity.endDate = new Date('2026-01-01');
      entity.trialStartDate = new Date('2025-06-01');
      entity.trialEndDate = new Date('2025-06-30');
      expect(entity.endDate).toEqual(new Date('2026-01-01'));
      expect(entity.trialStartDate).toEqual(new Date('2025-06-01'));
      expect(entity.trialEndDate).toEqual(new Date('2025-06-30'));
    });
  });
});
