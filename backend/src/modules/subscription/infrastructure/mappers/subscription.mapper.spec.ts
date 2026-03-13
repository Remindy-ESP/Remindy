import { SubscriptionMapper } from './subscription.mapper';
import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionEntity } from '../persistence/subscription.entity';

describe('SubscriptionMapper', () => {
  describe('toDomain', () => {
    it('should map SubscriptionEntity to Subscription domain with all fields', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-123';
      entity.contractId = 'contract-123';
      entity.name = 'Netflix';
      entity.amount = 9.99;
      entity.currency = 'EUR';
      entity.frequency = 'monthly';
      entity.startDate = new Date('2025-01-01');
      entity.nextDueDate = new Date('2025-02-01');
      entity.trialStartDate = new Date('2024-12-01');
      entity.trialEndDate = new Date('2024-12-31');
      // isTrialActive is a computed getter
      entity.status = 'active';
      entity.color = '#FF0000';
      entity.notes = 'Test notes';
      entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
      entity.updatedAt = new Date('2025-01-02T10:00:00.000Z');

      const domain = SubscriptionMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Subscription);
      expect(domain.id).toBe(entity.id);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.contractId).toBe(entity.contractId);
      expect(domain.name).toBe(entity.name);
      expect(domain.amount).toBe(9.99);
      expect(typeof domain.amount).toBe('number');
      expect(domain.currency).toBe(entity.currency);
      expect(domain.frequency).toBe(entity.frequency);
      expect(domain.startDate).toEqual(entity.startDate);
      expect(domain.nextDueDate).toEqual(entity.nextDueDate);
      expect(domain.trialStartDate).toEqual(entity.trialStartDate);
      expect(domain.trialEndDate).toEqual(entity.trialEndDate);
      expect(domain.isTrialActive).toBe(false);
      expect(domain.status).toBe(entity.status);
      expect(domain.color).toBe(entity.color);
      expect(domain.notes).toBe(entity.notes);
    });

    it('should map SubscriptionEntity without optional fields', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-456';
      entity.userId = 'user-456';
      entity.name = 'Spotify';
      entity.amount = 4.99;
      entity.currency = 'USD';
      entity.frequency = 'monthly';
      entity.startDate = new Date('2025-01-01');
      entity.nextDueDate = new Date('2025-02-01');
      // isTrialActive is a computed getter
      entity.status = 'active';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      const domain = SubscriptionMapper.toDomain(entity);

      expect(domain.contractId).toBeUndefined();
      expect(domain.trialStartDate).toBeUndefined();
      expect(domain.trialEndDate).toBeUndefined();
      expect(domain.color).toBeUndefined();
      expect(domain.notes).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should map Subscription domain to SubscriptionEntity', () => {
      const domain = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        contractId: 'contract-123',
        name: 'Netflix',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        trialStartDate: new Date('2024-12-01'),
        trialEndDate: new Date('2024-12-31'),
        status: 'active',
        color: '#FF0000',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = SubscriptionMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(SubscriptionEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.userId).toBe(domain.userId);
      expect(entity.contractId).toBe(domain.contractId);
      expect(entity.name).toBe(domain.name);
      expect(entity.amount).toBe(domain.amount);
      expect(entity.currency).toBe(domain.currency);
      expect(entity.frequency).toBe(domain.frequency);
      expect(entity.startDate).toEqual(domain.startDate);
      expect(entity.nextDueDate).toEqual(domain.nextDueDate);
      expect(entity.trialStartDate).toEqual(domain.trialStartDate);
      expect(entity.trialEndDate).toEqual(domain.trialEndDate);
      expect(entity.status).toBe(domain.status);
      expect(entity.color).toBe(domain.color);
      expect(entity.notes).toBe(domain.notes);
      expect(entity.createdAt).toEqual(domain.createdAt);
      expect(entity.updatedAt).toEqual(domain.updatedAt);
    });

    it('should map Subscription domain without id (new entity)', () => {
      const domain = new Subscription({
        userId: 'user-456',
        name: 'Spotify',
        amount: 4.99,
        currency: 'USD',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
      });

      const entity = SubscriptionMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBe(domain.userId);
    });

    it('should map Subscription domain with deletedAt set (covers deletedAt branch)', () => {
      const domain = new Subscription({
        id: 'sub-deleted',
        userId: 'user-789',
        name: 'Deleted Sub',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'cancelled',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
        deletedAt: new Date('2025-03-01T10:00:00.000Z'),
      });

      const entity = SubscriptionMapper.toPersistence(domain);

      expect(entity.deletedAt).toEqual(new Date('2025-03-01T10:00:00.000Z'));
    });
  });

  describe('toDomainArray', () => {
    it('should map array of SubscriptionEntities to array of Subscriptions', () => {
      const entities = [
        Object.assign(new SubscriptionEntity(), {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 9.99,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: new Date(),
          nextDueDate: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new SubscriptionEntity(), {
          id: 'sub-2',
          userId: 'user-2',
          name: 'Spotify',
          amount: 4.99,
          currency: 'USD',
          frequency: 'monthly',
          startDate: new Date(),
          nextDueDate: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = SubscriptionMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Subscription);
      expect(domains[0].id).toBe('sub-1');
      expect(domains[1]).toBeInstanceOf(Subscription);
      expect(domains[1].id).toBe('sub-2');
    });

    it('should return empty array when given empty array', () => {
      const domains = SubscriptionMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to persistence and back to domain', () => {
      const originalDomain = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        contractId: 'contract-123',
        name: 'Netflix',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        color: '#FF0000',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const entity = SubscriptionMapper.toPersistence(originalDomain);
      const mappedDomain = SubscriptionMapper.toDomain(entity);

      expect(mappedDomain.id).toBe(originalDomain.id);
      expect(mappedDomain.userId).toBe(originalDomain.userId);
      expect(mappedDomain.name).toBe(originalDomain.name);
      expect(mappedDomain.amount).toBe(originalDomain.amount);
      expect(mappedDomain.frequency).toBe(originalDomain.frequency);
      expect(mappedDomain.status).toBe(originalDomain.status);
    });
  });
});
