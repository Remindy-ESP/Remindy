import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionEntity } from '../persistence/subscription.entity';
import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionFilterAppDto } from '../../application/dto/subscription-filter-app.dto';
import { CategoryEntity } from '../../../category/infrastructure/persistence/category.entity';

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;
  let typeOrmRepository: jest.Mocked<Repository<SubscriptionEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<SubscriptionEntity>>;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRepository,
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<SubscriptionRepository>(SubscriptionRepository);
    typeOrmRepository = module.get(getRepositoryToken(SubscriptionEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new subscription', async () => {
      const subscription = new Subscription({
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const savedEntity = new SubscriptionEntity();
      savedEntity.id = 'sub-123';
      savedEntity.userId = subscription.userId;
      savedEntity.name = subscription.name;
      savedEntity.amount = subscription.amount;
      savedEntity.currency = subscription.currency;
      savedEntity.frequency = subscription.frequency;
      savedEntity.startDate = subscription.startDate;
      savedEntity.nextDueDate = subscription.nextDueDate;
      savedEntity.status = subscription.status;
      savedEntity.createdAt = new Date();
      savedEntity.updatedAt = new Date();

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.create(subscription);

      expect(result).toBeInstanceOf(Subscription);
      expect(result.id).toBe('sub-123');
      expect(result.name).toBe(subscription.name);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find and return a subscription by id', async () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-123';
      entity.name = 'Netflix';
      entity.amount = 15.99;
      entity.currency = 'EUR';
      entity.frequency = 'monthly';
      entity.startDate = new Date('2024-01-01');
      entity.nextDueDate = new Date('2024-02-01');
      entity.status = 'active';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findById('sub-123');

      expect(result).toBeInstanceOf(Subscription);
      expect(result?.id).toBe('sub-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        relations: ['category'],
      });
    });

    it('should return null when subscription not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions without filters', async () => {
      const entities = [
        Object.assign(new SubscriptionEntity(), {
          id: 'sub-1',
          userId: 'user-123',
          name: 'Netflix',
          amount: 15.99,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: new Date('2024-01-01'),
          nextDueDate: new Date('2024-02-01'),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      queryBuilder.getMany.mockResolvedValue(entities);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Subscription);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('subscription.category', 'category');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('subscription.createdAt', 'DESC');
    });

    it('should filter by userId', async () => {
      const filters: SubscriptionFilterAppDto = { userId: 'user-123' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.userId = :userId',
        { userId: 'user-123' }
      );
    });

    it('should filter by contractId', async () => {
      const filters: SubscriptionFilterAppDto = { contractId: 42 };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.contractId = :contractId',
        { contractId: 42 }
      );
    });

    it('should filter by name', async () => {
      const filters: SubscriptionFilterAppDto = { name: 'Netflix' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.name ILIKE :name',
        { name: '%Netflix%' }
      );
    });

    it('should filter by currency', async () => {
      const filters: SubscriptionFilterAppDto = { currency: 'USD' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.currency = :currency',
        { currency: 'USD' }
      );
    });

    it('should filter by frequency', async () => {
      const filters: SubscriptionFilterAppDto = { frequency: 'monthly' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.frequency = :frequency',
        { frequency: 'monthly' }
      );
    });

    it('should filter by status', async () => {
      const filters: SubscriptionFilterAppDto = { status: 'active' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.status = :status',
        { status: 'active' }
      );
    });

    it('should filter by categoryId', async () => {
      const filters: SubscriptionFilterAppDto = { categoryId: 'cat-123' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'subscription.categoryId = :categoryId',
        { categoryId: 'cat-123' }
      );
    });

    it('should apply multiple filters', async () => {
      const filters: SubscriptionFilterAppDto = {
        userId: 'user-123',
        name: 'Netflix',
        currency: 'USD',
        frequency: 'monthly',
        status: 'active',
        categoryId: 'cat-123',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(6);
    });
  });

  describe('findByFrequency', () => {
    it('should find subscriptions by frequency', async () => {
      const entities = [
        Object.assign(new SubscriptionEntity(), {
          id: 'sub-1',
          userId: 'user-123',
          name: 'Netflix',
          amount: 15.99,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: new Date('2024-01-01'),
          nextDueDate: new Date('2024-02-01'),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new SubscriptionEntity(), {
          id: 'sub-2',
          userId: 'user-456',
          name: 'Spotify',
          amount: 9.99,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: new Date('2024-01-15'),
          nextDueDate: new Date('2024-02-15'),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      typeOrmRepository.find.mockResolvedValue(entities);

      const result = await repository.findByFrequency('monthly');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Subscription);
      expect(result[1]).toBeInstanceOf(Subscription);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { frequency: 'monthly' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no subscriptions found', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findByFrequency('yearly');

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update and return the subscription', async () => {
      const existingEntity = new SubscriptionEntity();
      existingEntity.id = 'sub-123';
      existingEntity.userId = 'user-123';
      existingEntity.name = 'Netflix';
      existingEntity.amount = 15.99;
      existingEntity.currency = 'EUR';
      existingEntity.frequency = 'monthly';
      existingEntity.startDate = new Date('2024-01-01');
      existingEntity.nextDueDate = new Date('2024-02-01');
      existingEntity.status = 'active';
      existingEntity.createdAt = new Date();
      existingEntity.updatedAt = new Date();

      const updatedSubscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix Premium',
        amount: 19.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: existingEntity.startDate,
        nextDueDate: existingEntity.nextDueDate,
        status: 'active',
        createdAt: existingEntity.createdAt,
        updatedAt: new Date(),
      });

      const savedEntity = Object.assign(new SubscriptionEntity(), {
        ...existingEntity,
        name: updatedSubscription.name,
        amount: updatedSubscription.amount,
        updatedAt: updatedSubscription.updatedAt,
      });

      typeOrmRepository.findOne.mockResolvedValue(existingEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.update('sub-123', updatedSubscription);

      expect(result).toBeInstanceOf(Subscription);
      expect(result?.name).toBe('Netflix Premium');
      expect(result?.amount).toBe(19.99);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'sub-123' } });
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null when subscription not found', async () => {
      const subscription = new Subscription({
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', subscription);

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a subscription and return true', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('sub-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.delete).toHaveBeenCalledWith('sub-123');
    });

    it('should return false when subscription not found', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.delete('sub-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: null as any, raw: {} });

      const result = await repository.delete('sub-123');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a subscription and return true', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('sub-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('sub-123');
    });

    it('should return false when subscription not found', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: undefined,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('sub-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: null as any,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('sub-123');

      expect(result).toBe(false);
    });
  });
});
