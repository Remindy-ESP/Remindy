import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindEventSeriesBySubscriptionUseCase } from './find-event-series-by-subscription.use-case';
import type { IEventSeriesRepository } from '../ports/event-series-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../ports/event-series-repository.interface';
import { EventSeries } from '../../domain/event-series.entity';

describe('FindEventSeriesBySubscriptionUseCase', () => {
  let useCase: FindEventSeriesBySubscriptionUseCase;
  let repository: jest.Mocked<IEventSeriesRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventSeriesRepository>> = {
      findBySubscriptionId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindEventSeriesBySubscriptionUseCase,
        {
          provide: EVENT_SERIES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindEventSeriesBySubscriptionUseCase>(
      FindEventSeriesBySubscriptionUseCase,
    );
    repository = module.get(EVENT_SERIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find event series by subscription id', async () => {
    const subscriptionId = 'sub-123';
    const expectedEventSeries = new EventSeries({
      id: 'series-123',
      subscriptionId: subscriptionId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findBySubscriptionId.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(subscriptionId);

    expect(result).toBe(expectedEventSeries);
    expect(result.subscriptionId).toBe(subscriptionId);
    expect(repository.findBySubscriptionId).toHaveBeenCalledWith(subscriptionId);
    expect(repository.findBySubscriptionId).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when event series does not exist', async () => {
    const subscriptionId = 'non-existent-sub';

    repository.findBySubscriptionId.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Event series for subscription ${subscriptionId} not found`,
    );

    expect(repository.findBySubscriptionId).toHaveBeenCalledWith(subscriptionId);
  });

  it('should find event series with exdates', async () => {
    const subscriptionId = 'sub-456';
    const expectedEventSeries = new EventSeries({
      id: 'series-456',
      subscriptionId: subscriptionId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      timezone: 'Europe/Paris',
      exdates: [new Date('2025-03-01'), new Date('2025-04-01')],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findBySubscriptionId.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(subscriptionId);

    expect(result.exdates).toBeDefined();
    expect(result.exdates?.length).toBe(2);
  });

  it('should find event series with rdates', async () => {
    const subscriptionId = 'sub-789';
    const expectedEventSeries = new EventSeries({
      id: 'series-789',
      subscriptionId: subscriptionId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      timezone: 'Europe/Paris',
      rdates: [new Date('2025-05-15')],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findBySubscriptionId.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(subscriptionId);

    expect(result.rdates).toBeDefined();
    expect(result.rdates?.length).toBe(1);
  });

  it('should find event series with custom timezone', async () => {
    const subscriptionId = 'sub-999';
    const expectedEventSeries = new EventSeries({
      id: 'series-999',
      subscriptionId: subscriptionId,
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      dtstart: new Date('2025-02-03'),
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findBySubscriptionId.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(subscriptionId);

    expect(result.timezone).toBe('America/New_York');
  });

  it('should find event series with all optional fields', async () => {
    const subscriptionId = 'sub-111';
    const expectedEventSeries = new EventSeries({
      id: 'series-111',
      subscriptionId: subscriptionId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1;COUNT=12',
      dtstart: new Date('2025-02-01'),
      timezone: 'UTC',
      exdates: [new Date('2025-03-01')],
      rdates: [new Date('2025-05-15')],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findBySubscriptionId.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(subscriptionId);

    expect(result.subscriptionId).toBe(subscriptionId);
    expect(result.exdates).toBeDefined();
    expect(result.rdates).toBeDefined();
    expect(result.timezone).toBe('UTC');
  });
});
