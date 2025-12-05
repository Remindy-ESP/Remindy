import { Test, TestingModule } from '@nestjs/testing';
import { CreateEventSeriesUseCase } from './create-event-series.use-case';
import type { IEventSeriesRepository } from '../ports/event-series-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../ports/event-series-repository.interface';
import { EventSeries } from '../../domain/event-series.entity';
import { CreateEventSeriesAppDto } from '../dto/create-event-series-app.dto';

describe('CreateEventSeriesUseCase', () => {
  let useCase: CreateEventSeriesUseCase;
  let repository: jest.Mocked<IEventSeriesRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventSeriesRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEventSeriesUseCase,
        {
          provide: EVENT_SERIES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateEventSeriesUseCase>(CreateEventSeriesUseCase);
    repository = module.get(EVENT_SERIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create an event series with minimal required fields', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-123',
      subscriptionId: dto.subscriptionId,
      rrule: dto.rrule,
      dtstart: dto.dtstart,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedEventSeries);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: dto.subscriptionId,
        rrule: dto.rrule,
        dtstart: dto.dtstart,
        timezone: 'Europe/Paris',
      }),
    );
  });

  it('should create an event series with custom timezone', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      timezone: 'America/New_York',
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-456',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.timezone).toBe('America/New_York');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'America/New_York',
      }),
    );
  });

  it('should default timezone to Europe/Paris when not provided', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=WEEKLY;INTERVAL=2',
      dtstart: new Date('2025-02-01'),
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-789',
      ...dto,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    await useCase.execute(dto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'Europe/Paris',
      }),
    );
  });

  it('should create an event series with exdates', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      exdates: [new Date('2025-03-01'), new Date('2025-04-01')],
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-999',
      ...dto,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.exdates).toEqual(dto.exdates);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        exdates: dto.exdates,
      }),
    );
  });

  it('should create an event series with rdates', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: new Date('2025-02-01'),
      rdates: [new Date('2025-05-15'), new Date('2025-06-15')],
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-111',
      ...dto,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.rdates).toEqual(dto.rdates);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rdates: dto.rdates,
      }),
    );
  });

  it('should create an event series with all optional fields', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY;INTERVAL=1;COUNT=12',
      dtstart: new Date('2025-02-01'),
      timezone: 'UTC',
      exdates: [new Date('2025-03-01')],
      rdates: [new Date('2025-05-15')],
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-222',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.subscriptionId).toBe(dto.subscriptionId);
    expect(result.rrule).toBe(dto.rrule);
    expect(result.timezone).toBe(dto.timezone);
    expect(result.exdates).toEqual(dto.exdates);
    expect(result.rdates).toEqual(dto.rdates);
  });

  it('should create an event series with weekly recurrence', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      dtstart: new Date('2025-02-03'),
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-333',
      ...dto,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR');
  });

  it('should create an event series with yearly recurrence', async () => {
    const dto: CreateEventSeriesAppDto = {
      subscriptionId: 'sub-123',
      rrule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
      dtstart: new Date('2025-12-25'),
    };

    const expectedEventSeries = new EventSeries({
      id: 'series-444',
      ...dto,
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedEventSeries);

    const result = await useCase.execute(dto);

    expect(result.rrule).toBe('FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25');
  });
});
