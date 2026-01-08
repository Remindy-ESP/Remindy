import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateQueryBuilder } from 'typeorm';
import { EventRepository } from './event.repository';
import { EventEntity } from '../persistence/event.entity';
import { Event } from '../../domain/event.entity';
import { EventFilterAppDto } from '../../application/dto/event-filter-app.dto';

describe('EventRepository', () => {
  let repository: EventRepository;
  let typeOrmRepository: jest.Mocked<Repository<EventEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<EventEntity>>;
  let updateQueryBuilder: jest.Mocked<UpdateQueryBuilder<EventEntity>>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    updateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as any;

    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventRepository,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<EventRepository>(EventRepository);
    typeOrmRepository = module.get(getRepositoryToken(EventEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new event', async () => {
      const event = new Event({
        subscriptionId: 'sub-123',
        title: 'Netflix Payment',
        amount: 15.99,
        startsAt: new Date('2024-01-15'),
        status: 'scheduled',
        paymentStatus: 'pending',
      });

      const savedEntity = new EventEntity();
      savedEntity.id = 'event-123';
      savedEntity.subscriptionId = event.subscriptionId;
      savedEntity.title = event.title;
      savedEntity.amount = event.amount;
      savedEntity.startsAt = event.startsAt;
      savedEntity.status = event.status;
      savedEntity.paymentStatus = event.paymentStatus;
      savedEntity.createdAt = new Date();
      savedEntity.updatedAt = new Date();

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.create(event);

      expect(result).toBeInstanceOf(Event);
      expect(result.id).toBe('event-123');
      expect(result.title).toBe('Netflix Payment');
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('createMany', () => {
    it('should create multiple events at once', async () => {
      const events = [
        new Event({
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: new Date('2024-01-15'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
        new Event({
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: new Date('2024-02-15'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
      ];

      const savedEntities = events.map((event, index) => {
        const entity = new EventEntity();
        entity.id = `event-${index}`;
        entity.subscriptionId = event.subscriptionId;
        entity.title = event.title;
        entity.amount = event.amount;
        entity.startsAt = event.startsAt;
        entity.status = event.status;
        entity.paymentStatus = event.paymentStatus;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();
        return entity;
      });

      typeOrmRepository.save.mockResolvedValue(savedEntities as any);

      const result = await repository.createMany(events);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Event);
      expect(result[1]).toBeInstanceOf(Event);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      typeOrmRepository.save.mockResolvedValue([]);

      const result = await repository.createMany([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find and return an event by id', async () => {
      const entity = new EventEntity();
      entity.id = 'event-123';
      entity.subscriptionId = 'sub-123';
      entity.title = 'Netflix Payment';
      entity.amount = 15.99;
      entity.startsAt = new Date('2024-01-15');
      entity.status = 'scheduled';
      entity.paymentStatus = 'pending';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findById('event-123');

      expect(result).toBeInstanceOf(Event);
      expect(result?.id).toBe('event-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
    });

    it('should return null when event not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all events without filters', async () => {
      const entities = [
        Object.assign(new EventEntity(), {
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Payment 1',
          amount: 15.99,
          startsAt: new Date('2024-01-15'),
          status: 'scheduled',
          paymentStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      queryBuilder.getMany.mockResolvedValue(entities);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Event);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.startsAt', 'ASC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('should filter by start date', async () => {
      const filters: EventFilterAppDto = { start: new Date('2024-01-01') };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('event.startsAt >= :start', {
        start: filters.start,
      });
    });

    it('should filter by end date', async () => {
      const filters: EventFilterAppDto = { end: new Date('2024-12-31') };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('event.startsAt <= :end', {
        end: filters.end,
      });
    });

    it('should filter by subscriptionId', async () => {
      const filters: EventFilterAppDto = { subscriptionId: 'sub-123' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('event.subscriptionId = :subscriptionId', {
        subscriptionId: 'sub-123',
      });
    });

    it('should filter by status', async () => {
      const filters: EventFilterAppDto = { status: 'completed' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('event.status = :status', {
        status: 'completed',
      });
    });

    it('should filter by paymentStatus', async () => {
      const filters: EventFilterAppDto = { paymentStatus: 'paid' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('event.paymentStatus = :paymentStatus', {
        paymentStatus: 'paid',
      });
    });

    it('should apply custom limit', async () => {
      const filters: EventFilterAppDto = { limit: 50 };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should sort by starts_at ascending', async () => {
      const filters: EventFilterAppDto = { sort: 'starts_at:asc' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.startsAt', 'ASC');
    });

    it('should sort by starts_at descending', async () => {
      const filters: EventFilterAppDto = { sort: 'starts_at:desc' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.startsAt', 'DESC');
    });

    it('should sort by amount ascending', async () => {
      const filters: EventFilterAppDto = { sort: 'amount:asc' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.amount', 'ASC');
    });

    it('should sort by amount descending', async () => {
      const filters: EventFilterAppDto = { sort: 'amount:desc' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.amount', 'DESC');
    });

    it('should apply multiple filters', async () => {
      const filters: EventFilterAppDto = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        subscriptionId: 'sub-123',
        status: 'scheduled',
        paymentStatus: 'pending',
        limit: 25,
        sort: 'starts_at:desc',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(5);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('event.startsAt', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('findBySubscriptionId', () => {
    it('should find all events for a subscription', async () => {
      const entities = [
        Object.assign(new EventEntity(), {
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Payment 1',
          amount: 15.99,
          startsAt: new Date('2024-01-15'),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new EventEntity(), {
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Payment 2',
          amount: 15.99,
          startsAt: new Date('2024-02-15'),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      typeOrmRepository.find.mockResolvedValue(entities);

      const result = await repository.findBySubscriptionId('sub-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Event);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-123' },
        order: { startsAt: 'ASC' },
      });
    });

    it('should return empty array when no events found', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findBySubscriptionId('sub-456');

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update and return the event', async () => {
      const existingEntity = new EventEntity();
      existingEntity.id = 'event-123';
      existingEntity.subscriptionId = 'sub-123';
      existingEntity.title = 'Netflix Payment';
      existingEntity.amount = 15.99;
      existingEntity.startsAt = new Date('2024-01-15');
      existingEntity.status = 'scheduled';
      existingEntity.paymentStatus = 'pending';
      existingEntity.createdAt = new Date();
      existingEntity.updatedAt = new Date();

      const updatedEvent = new Event({
        id: 'event-123',
        subscriptionId: 'sub-123',
        title: 'Netflix Premium',
        amount: 19.99,
        startsAt: existingEntity.startsAt,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: existingEntity.createdAt,
        updatedAt: new Date(),
      });

      const savedEntity = Object.assign(new EventEntity(), {
        ...existingEntity,
        title: updatedEvent.title,
        amount: updatedEvent.amount,
        status: updatedEvent.status,
        paymentStatus: updatedEvent.paymentStatus,
        updatedAt: updatedEvent.updatedAt,
      });

      typeOrmRepository.findOne.mockResolvedValue(existingEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.update('event-123', updatedEvent);

      expect(result).toBeInstanceOf(Event);
      expect(result?.title).toBe('Netflix Premium');
      expect(result?.amount).toBe(19.99);
      expect(result?.status).toBe('completed');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-123' } });
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null when event not found', async () => {
      const event = new Event({
        subscriptionId: 'sub-123',
        title: 'Netflix Payment',
        amount: 15.99,
        startsAt: new Date('2024-01-15'),
        status: 'scheduled',
        paymentStatus: 'pending',
      });

      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', event);

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an event and return true', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('event-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.delete).toHaveBeenCalledWith('event-123');
    });

    it('should return false when event not found', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.delete('event-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: null as any, raw: {} });

      const result = await repository.delete('event-123');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an event and return true', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('event-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('event-123');
    });

    it('should return false when event not found', async () => {
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

      const result = await repository.softDelete('event-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: null as any,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('event-123');

      expect(result).toBe(false);
    });
  });

  describe('updateFutureEventsStatus', () => {
    beforeEach(() => {
      typeOrmRepository.createQueryBuilder.mockReturnValue(updateQueryBuilder as any);
    });

    it('should update future events status and return count', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: 5, raw: {} });

      const result = await repository.updateFutureEventsStatus('sub-123', 'canceled');

      expect(result).toBe(5);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith(EventEntity);
      expect(updateQueryBuilder.set).toHaveBeenCalledWith({ status: 'canceled' });
      expect(updateQueryBuilder.where).toHaveBeenCalledWith('subscriptionId = :subscriptionId', {
        subscriptionId: 'sub-123',
      });
      expect(updateQueryBuilder.andWhere).toHaveBeenCalledWith('startsAt > :now', {
        now: expect.any(Date),
      });
      expect(updateQueryBuilder.andWhere).toHaveBeenCalledWith('status = :scheduledStatus', {
        scheduledStatus: 'scheduled',
      });
      expect(updateQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should return 0 when no events updated', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.updateFutureEventsStatus('sub-456', 'canceled');

      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.updateFutureEventsStatus('sub-123', 'canceled');

      expect(result).toBe(0);
    });

    it('should return 0 when affected is null', async () => {
      updateQueryBuilder.execute.mockResolvedValue({ affected: null as any, raw: {} });

      const result = await repository.updateFutureEventsStatus('sub-123', 'canceled');

      expect(result).toBe(0);
    });
  });
});
