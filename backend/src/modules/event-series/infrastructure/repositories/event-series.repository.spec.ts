import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSeriesRepository } from './event-series.repository';
import { EventSeriesEntity } from '../persistence/event-series.entity';
import { EventSeries } from '../../domain/event-series.entity';

describe('EventSeriesRepository', () => {
  let repository: EventSeriesRepository;
  let typeOrmRepository: jest.Mocked<Repository<EventSeriesEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventSeriesRepository,
        {
          provide: getRepositoryToken(EventSeriesEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<EventSeriesRepository>(EventSeriesRepository);
    typeOrmRepository = module.get(getRepositoryToken(EventSeriesEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new event series', async () => {
      const eventSeries = new EventSeries({
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      const savedEntity = new EventSeriesEntity();
      savedEntity.id = 'series-123';
      savedEntity.subscriptionId = eventSeries.subscriptionId;
      savedEntity.rrule = eventSeries.rrule;
      savedEntity.dtstart = eventSeries.dtstart;
      savedEntity.timezone = eventSeries.timezone;
      savedEntity.createdAt = new Date();
      savedEntity.updatedAt = new Date();

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.create(eventSeries);

      expect(result).toBeInstanceOf(EventSeries);
      expect(result.id).toBe('series-123');
      expect(result.subscriptionId).toBe('sub-123');
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find and return an event series by id', async () => {
      const entity = new EventSeriesEntity();
      entity.id = 'series-123';
      entity.subscriptionId = 'sub-123';
      entity.rrule = 'FREQ=MONTHLY;INTERVAL=1';
      entity.dtstart = new Date('2024-01-01');
      entity.timezone = 'UTC';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findById('series-123');

      expect(result).toBeInstanceOf(EventSeries);
      expect(result?.id).toBe('series-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'series-123' },
      });
    });

    it('should return null when event series not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySubscriptionId', () => {
    it('should find and return an event series by subscription id', async () => {
      const entity = new EventSeriesEntity();
      entity.id = 'series-123';
      entity.subscriptionId = 'sub-123';
      entity.rrule = 'FREQ=MONTHLY;INTERVAL=1';
      entity.dtstart = new Date('2024-01-01');
      entity.timezone = 'UTC';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findBySubscriptionId('sub-123');

      expect(result).toBeInstanceOf(EventSeries);
      expect(result?.subscriptionId).toBe('sub-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-123' },
      });
    });

    it('should return null when no series found for subscription', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySubscriptionId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the event series', async () => {
      const existingEntity = new EventSeriesEntity();
      existingEntity.id = 'series-123';
      existingEntity.subscriptionId = 'sub-123';
      existingEntity.rrule = 'FREQ=MONTHLY;INTERVAL=1';
      existingEntity.dtstart = new Date('2024-01-01');
      existingEntity.timezone = 'UTC';
      existingEntity.createdAt = new Date();
      existingEntity.updatedAt = new Date();

      const updatedEventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=WEEKLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'America/New_York',
        createdAt: existingEntity.createdAt,
        updatedAt: new Date(),
      });

      const savedEntity = Object.assign(new EventSeriesEntity(), {
        ...existingEntity,
        rrule: updatedEventSeries.rrule,
        timezone: updatedEventSeries.timezone,
        updatedAt: updatedEventSeries.updatedAt,
      });

      typeOrmRepository.findOne.mockResolvedValue(existingEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.update('series-123', updatedEventSeries);

      expect(result).toBeInstanceOf(EventSeries);
      expect(result?.rrule).toBe('FREQ=WEEKLY;INTERVAL=1');
      expect(result?.timezone).toBe('America/New_York');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'series-123' } });
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null when event series not found', async () => {
      const eventSeries = new EventSeries({
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', eventSeries);

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an event series and return true', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('series-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.delete).toHaveBeenCalledWith('series-123');
    });

    it('should return false when event series not found', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: null, raw: {} });

      const result = await repository.delete('series-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.delete('series-123');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an event series and return true', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('series-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('series-123');
    });

    it('should return false when event series not found', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: null,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('series-123');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({
        affected: undefined,
        raw: {},
        generatedMaps: []
      });

      const result = await repository.softDelete('series-123');

      expect(result).toBe(false);
    });
  });
});
