import { Test, TestingModule } from '@nestjs/testing';
import { GenerateEventsForSubscriptionUseCase, GenerateEventsForSubscriptionDto } from './generate-events-for-subscription.use-case';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { makeEventDomain } from '../../__fixtures__/event.fixtures';

describe('GenerateEventsForSubscriptionUseCase', () => {
  let useCase: GenerateEventsForSubscriptionUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findBySubscriptionId: jest.fn(),
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateEventsForSubscriptionUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GenerateEventsForSubscriptionUseCase>(GenerateEventsForSubscriptionUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should generate new events when no existing events', async () => {
    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [
        { startsAt: new Date('2025-02-01T10:00:00.000Z') },
        { startsAt: new Date('2025-03-01T10:00:00.000Z') },
      ],
    };

    const createdEvents = [makeEventDomain(), makeEventDomain()];

    repository.findBySubscriptionId.mockResolvedValue([]);
    repository.createMany.mockResolvedValue(createdEvents);

    const result = await useCase.execute(dto);

    expect(result).toBe(createdEvents);
    expect(repository.findBySubscriptionId).toHaveBeenCalledWith('sub-1');
    expect(repository.createMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.any(Event),
      expect.any(Event),
    ]));
    expect(repository.createMany.mock.calls[0][0]).toHaveLength(2);
  });

  it('should filter out occurrences that already have events (deduplication)', async () => {
    const existingDate = new Date('2025-02-01T10:00:00.000Z');
    const existingEvent = makeEventDomain({ startsAt: existingDate });

    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [
        { startsAt: existingDate }, // Already exists
        { startsAt: new Date('2025-03-01T10:00:00.000Z') }, // New
      ],
    };

    const createdEvents = [makeEventDomain()];

    repository.findBySubscriptionId.mockResolvedValue([existingEvent]);
    repository.createMany.mockResolvedValue(createdEvents);

    const result = await useCase.execute(dto);

    expect(result).toBe(createdEvents);
    // Only 1 new event should be created
    expect(repository.createMany.mock.calls[0][0]).toHaveLength(1);
  });

  it('should return empty array when all occurrences already exist', async () => {
    const existingDate = new Date('2025-02-01T10:00:00.000Z');
    const existingEvent = makeEventDomain({ startsAt: existingDate });

    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [
        { startsAt: existingDate }, // Already exists
      ],
    };

    repository.findBySubscriptionId.mockResolvedValue([existingEvent]);

    const result = await useCase.execute(dto);

    expect(result).toEqual([]);
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('should return empty array when no occurrences provided', async () => {
    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [],
    };

    repository.findBySubscriptionId.mockResolvedValue([]);

    const result = await useCase.execute(dto);

    expect(result).toEqual([]);
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('should create events with correct properties', async () => {
    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [
        { startsAt: new Date('2025-02-01T10:00:00.000Z') },
      ],
    };

    repository.findBySubscriptionId.mockResolvedValue([]);
    repository.createMany.mockResolvedValue([makeEventDomain()]);

    await useCase.execute(dto);

    const createdEvent = repository.createMany.mock.calls[0][0][0];
    expect(createdEvent.subscriptionId).toBe('sub-1');
    expect(createdEvent.eventSeriesId).toBe('series-1');
    expect(createdEvent.title).toBe('Paiement Netflix');
    expect(createdEvent.amount).toBe(9.99);
    expect(createdEvent.status).toBe('scheduled');
    expect(createdEvent.paymentStatus).toBe('pending');
  });

  it('should propagate repository errors', async () => {
    const dto: GenerateEventsForSubscriptionDto = {
      subscriptionId: 'sub-1',
      subscriptionName: 'Netflix',
      subscriptionAmount: 9.99,
      eventSeriesId: 'series-1',
      occurrences: [{ startsAt: new Date('2025-02-01') }],
    };

    repository.findBySubscriptionId.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(dto)).rejects.toThrow('Database error');
  });
});
