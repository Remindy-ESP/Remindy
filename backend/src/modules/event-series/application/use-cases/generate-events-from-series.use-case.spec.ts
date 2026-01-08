import { Test, TestingModule } from '@nestjs/testing';
import { GenerateEventsFromSeriesUseCase } from './generate-events-from-series.use-case';
import { EVENT_SERIES_REPOSITORY } from '../ports/event-series-repository.interface';
import { EventSeries } from '../../domain/event-series.entity';
import { RRule, RRuleSet } from 'rrule';

describe('GenerateEventsFromSeriesUseCase', () => {
  let useCase: GenerateEventsFromSeriesUseCase;
  let eventSeriesRepository: any;

  beforeEach(async () => {
    const mockEventSeriesRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateEventsFromSeriesUseCase,
        {
          provide: EVENT_SERIES_REPOSITORY,
          useValue: mockEventSeriesRepository,
        },
      ],
    }).compile();

    useCase = module.get<GenerateEventsFromSeriesUseCase>(GenerateEventsFromSeriesUseCase);
    eventSeriesRepository = module.get(EVENT_SERIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw error when event series not found', async () => {
      eventSeriesRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          'non-existent',
          new Date('2024-01-01'),
          new Date('2024-12-31'),
        ),
      ).rejects.toThrow('Event series non-existent not found');

      expect(eventSeriesRepository.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should generate monthly occurrences from simple RRULE', async () => {
      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-123',
        new Date('2024-01-01'),
        new Date('2024-04-01'),
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(4);
      expect(result[0]).toMatchObject({
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-123',
        startsAt: expect.any(Date),
      });
    });

    it('should generate weekly occurrences from RRULE', async () => {
      const eventSeries = new EventSeries({
        id: 'series-456',
        subscriptionId: 'sub-456',
        rrule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
        dtstart: new Date('2024-01-01T09:00:00Z'),
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-456',
        new Date('2024-01-01'),
        new Date('2024-02-01'),
      );

      expect(result.length).toBeGreaterThan(0);
      result.forEach(occurrence => {
        expect(occurrence.subscriptionId).toBe('sub-456');
        expect(occurrence.eventSeriesId).toBe('series-456');
      });
    });

    it('should limit occurrences to maxOccurrences parameter', async () => {
      const eventSeries = new EventSeries({
        id: 'series-limit',
        subscriptionId: 'sub-limit',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const maxOccurrences = 10;
      const result = await useCase.execute(
        'series-limit',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        maxOccurrences,
      );

      expect(result.length).toBeLessThanOrEqual(maxOccurrences);
    });

    it('should use default maxOccurrences of 365 when not specified', async () => {
      const eventSeries = new EventSeries({
        id: 'series-default',
        subscriptionId: 'sub-default',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      // Generate for 2 years worth of daily events
      const result = await useCase.execute(
        'series-default',
        new Date('2024-01-01'),
        new Date('2025-12-31'),
      );

      // Should be limited to 365 even though date range would produce more
      expect(result.length).toBeLessThanOrEqual(365);
    });

    it('should handle RRULE with exdates to exclude specific dates', async () => {
      const eventSeries = new EventSeries({
        id: 'series-exdates',
        subscriptionId: 'sub-exdates',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
        exdates: [
          new Date('2024-01-05T10:00:00Z'),
          new Date('2024-01-10T10:00:00Z'),
        ],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-exdates',
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        20,
      );

      // Verify excluded dates are not in results
      const resultDates = result.map(r => r.startsAt.toISOString());
      expect(resultDates).not.toContain(new Date('2024-01-05T10:00:00Z').toISOString());
      expect(resultDates).not.toContain(new Date('2024-01-10T10:00:00Z').toISOString());
    });

    it('should handle RRULE without exdates', async () => {
      const eventSeries = new EventSeries({
        id: 'series-no-exdates',
        subscriptionId: 'sub-no-exdates',
        rrule: 'FREQ=WEEKLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
        exdates: [],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-no-exdates',
        new Date('2024-01-01'),
        new Date('2024-02-01'),
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle RRULE with rdates to add specific dates', async () => {
      const eventSeries = new EventSeries({
        id: 'series-rdates',
        subscriptionId: 'sub-rdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
        rdates: [
          new Date('2024-01-15T10:00:00Z'),
          new Date('2024-02-15T10:00:00Z'),
        ],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-rdates',
        new Date('2024-01-01'),
        new Date('2024-03-01'),
      );

      // Results should include both regular occurrences and rdates
      expect(result.length).toBeGreaterThan(0);
      const resultDates = result.map(r => r.startsAt.toISOString());
      expect(resultDates).toContain(new Date('2024-01-15T10:00:00Z').toISOString());
      expect(resultDates).toContain(new Date('2024-02-15T10:00:00Z').toISOString());
    });

    it('should handle RRULE without rdates', async () => {
      const eventSeries = new EventSeries({
        id: 'series-no-rdates',
        subscriptionId: 'sub-no-rdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
        rdates: [],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-no-rdates',
        new Date('2024-01-01'),
        new Date('2024-04-01'),
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle RRULE with both exdates and rdates', async () => {
      const eventSeries = new EventSeries({
        id: 'series-both',
        subscriptionId: 'sub-both',
        rrule: 'FREQ=WEEKLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'UTC',
        exdates: [new Date('2024-01-08T10:00:00Z')],
        rdates: [new Date('2024-01-15T10:00:00Z')],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-both',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      const resultDates = result.map(r => r.startsAt.toISOString());
      expect(resultDates).not.toContain(new Date('2024-01-08T10:00:00Z').toISOString());
      expect(resultDates).toContain(new Date('2024-01-15T10:00:00Z').toISOString());
    });

    it('should respect timezone in RRULE parsing', async () => {
      const eventSeries = new EventSeries({
        id: 'series-tz',
        subscriptionId: 'sub-tz',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01T10:00:00Z'),
        timezone: 'America/New_York',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.execute(
        'series-tz',
        new Date('2024-01-01'),
        new Date('2024-04-01'),
      );

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateNext', () => {
    it('should throw error when event series not found', async () => {
      eventSeriesRepository.findById.mockResolvedValue(null);

      await expect(useCase.generateNext('non-existent', 12)).rejects.toThrow(
        'Event series non-existent not found',
      );
    });

    it('should generate next N occurrences from now', async () => {
      const eventSeries = new EventSeries({
        id: 'series-next',
        subscriptionId: 'sub-next',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00Z'), // Past date
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const count = 6;
      const result = await useCase.generateNext('series-next', count);

      // Should generate future occurrences only
      const now = new Date();
      result.forEach(occurrence => {
        expect(occurrence.startsAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
      });

      expect(result.length).toBeLessThanOrEqual(count);
    });

    it('should use default count of 12 when not specified', async () => {
      const eventSeries = new EventSeries({
        id: 'series-default-count',
        subscriptionId: 'sub-default-count',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00Z'),
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-default-count');

      expect(result.length).toBeLessThanOrEqual(12);
    });

    it('should handle exdates when generating next occurrences', async () => {
      const futureDate1 = new Date();
      futureDate1.setMonth(futureDate1.getMonth() + 2);

      const eventSeries = new EventSeries({
        id: 'series-next-exdates',
        subscriptionId: 'sub-next-exdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00Z'),
        timezone: 'UTC',
        exdates: [futureDate1],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-next-exdates', 5);

      // Verify excluded dates are not in results
      const resultDates = result.map(r => r.startsAt.toISOString());
      expect(resultDates).not.toContain(futureDate1.toISOString());
    });

    it('should handle rdates when generating next occurrences', async () => {
      const futureDate1 = new Date();
      futureDate1.setMonth(futureDate1.getMonth() + 1);
      futureDate1.setDate(15);

      const eventSeries = new EventSeries({
        id: 'series-next-rdates',
        subscriptionId: 'sub-next-rdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=3',
        dtstart: new Date('2020-01-01T10:00:00Z'),
        timezone: 'UTC',
        rdates: [futureDate1],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-next-rdates', 10);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty exdates array', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1); // Start from tomorrow

      const eventSeries = new EventSeries({
        id: 'series-empty-exdates',
        subscriptionId: 'sub-empty-exdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=1;COUNT=5',
        dtstart: futureStart,
        timezone: 'UTC',
        exdates: [],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-empty-exdates', 3);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty rdates array', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1); // Start from tomorrow

      const eventSeries = new EventSeries({
        id: 'series-empty-rdates',
        subscriptionId: 'sub-empty-rdates',
        rrule: 'FREQ=MONTHLY;INTERVAL=1;COUNT=5',
        dtstart: futureStart,
        timezone: 'UTC',
        rdates: [],
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-empty-rdates', 3);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should return correct structure for generated occurrences', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1); // Start from tomorrow

      const eventSeries = new EventSeries({
        id: 'series-structure',
        subscriptionId: 'sub-structure',
        rrule: 'FREQ=MONTHLY;INTERVAL=1;COUNT=3',
        dtstart: futureStart,
        timezone: 'UTC',
      });

      eventSeriesRepository.findById.mockResolvedValue(eventSeries);

      const result = await useCase.generateNext('series-structure', 1);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        subscriptionId: 'sub-structure',
        eventSeriesId: 'series-structure',
        startsAt: expect.any(Date),
      });
    });
  });
});
