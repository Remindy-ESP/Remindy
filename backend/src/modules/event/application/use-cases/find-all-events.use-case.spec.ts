import { Test, TestingModule } from '@nestjs/testing';
import { FindAllEventsUseCase } from './find-all-events.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { EventFilterAppDto } from '../dto/event-filter-app.dto';

describe('FindAllEventsUseCase', () => {
  let useCase: FindAllEventsUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllEventsUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllEventsUseCase>(FindAllEventsUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all events without filters', async () => {
    const expectedEvents = [
      new Event({
        id: 'event-1',
        subscriptionId: 'sub-1',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Event({
        id: 'event-2',
        subscriptionId: 'sub-2',
        title: 'Annual Payment',
        amount: 99.99,
        startsAt: new Date('2025-03-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedEvents);

    const result = await useCase.execute();

    expect(result).toBe(expectedEvents);
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith(undefined);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should find events filtered by date range', async () => {
    const filters: EventFilterAppDto = {
      start: new Date('2025-02-01'),
      end: new Date('2025-02-28'),
    };

    const expectedEvents = [
      new Event({
        id: 'event-1',
        subscriptionId: 'sub-1',
        title: 'February Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-15'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedEvents);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].startsAt.getMonth()).toBe(1); // February (0-indexed)
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should find events filtered by subscription ID', async () => {
    const filters: EventFilterAppDto = {
      subscriptionId: 'sub-123',
    };

    const expectedEvents = [
      new Event({
        id: 'event-1',
        subscriptionId: 'sub-123',
        title: 'Payment 1',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Event({
        id: 'event-2',
        subscriptionId: 'sub-123',
        title: 'Payment 2',
        amount: 9.99,
        startsAt: new Date('2025-03-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedEvents);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(2);
    expect(result.every(e => e.subscriptionId === 'sub-123')).toBe(true);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should find events filtered by status', async () => {
    const filters: EventFilterAppDto = {
      status: 'completed',
    };

    const expectedEvents = [
      new Event({
        id: 'event-1',
        subscriptionId: 'sub-1',
        title: 'Completed Payment',
        amount: 9.99,
        startsAt: new Date('2025-01-01'),
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedEvents);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('completed');
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should find events with limit and sorting', async () => {
    const filters: EventFilterAppDto = {
      limit: 10,
      sort: 'starts_at:desc',
    };

    const expectedEvents = [
      new Event({
        id: 'event-2',
        subscriptionId: 'sub-1',
        title: 'Latest Payment',
        amount: 9.99,
        startsAt: new Date('2025-03-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Event({
        id: 'event-1',
        subscriptionId: 'sub-1',
        title: 'Earlier Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedEvents);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(2);
    expect(result[0].startsAt > result[1].startsAt).toBe(true);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty array when no events found', async () => {
    const filters: EventFilterAppDto = {
      subscriptionId: 'non-existent',
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(filters);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });
});
