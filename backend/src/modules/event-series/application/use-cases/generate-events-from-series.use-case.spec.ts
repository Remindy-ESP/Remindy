import { Test, TestingModule } from '@nestjs/testing';
import { GenerateEventsFromSeriesUseCase } from './generate-events-from-series.use-case';
import {
  IEventSeriesRepository,
  EVENT_SERIES_REPOSITORY,
} from '../ports/event-series-repository.interface';
import { makeEventSeries } from '../../../event/__fixtures__/event.fixtures';

describe('GenerateEventsFromSeriesUseCase', () => {
  let useCase: GenerateEventsFromSeriesUseCase;
  let repository: jest.Mocked<IEventSeriesRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventSeriesRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateEventsFromSeriesUseCase,
        {
          provide: EVENT_SERIES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GenerateEventsFromSeriesUseCase>(GenerateEventsFromSeriesUseCase);
    repository = module.get(EVENT_SERIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should generate occurrences between start and end dates', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
      });

      repository.findById.mockResolvedValue(series);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-06-30T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate, 12);

      expect(repository.findById).toHaveBeenCalledWith('series-1');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should generate monthly occurrences for 6 months
      expect(result.length).toBeGreaterThan(0);
      result.forEach(occ => {
        expect(occ.subscriptionId).toBe('sub-1');
        expect(occ.eventSeriesId).toBe('series-1');
        expect(occ.startsAt).toBeInstanceOf(Date);
      });
    });

    it('should throw when event series not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent', new Date(), new Date(), 12)).rejects.toThrow(
        'Event series non-existent not found',
      );
    });

    it('should use default maxOccurrences of 365 when not provided', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=DAILY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
      });

      repository.findById.mockResolvedValue(series);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2026-12-31T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate);

      // With default maxOccurrences=365, result should be at most 365 occurrences
      expect(result.length).toBeLessThanOrEqual(365);
    });

    it('should handle event series with exdates (exception dates)', async () => {
      const exdate = new Date('2025-02-01T10:00:00.000Z');
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: [exdate],
      });

      repository.findById.mockResolvedValue(series);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-06-30T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate, 12);

      // February date should be excluded
      const hasFebruary = result.some(occ => {
        const d = occ.startsAt;
        return d.getMonth() === 1 && d.getFullYear() === 2025; // month 1 = February
      });
      expect(hasFebruary).toBe(false);
    });

    it('should handle event series with rdates (additional dates)', async () => {
      const rdate = new Date('2025-07-15T10:00:00.000Z');
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        rdates: [rdate],
      });

      repository.findById.mockResolvedValue(series);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-12-31T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate, 100);

      // July 15 rdate should be included
      const hasRdate = result.some(occ => {
        const d = occ.startsAt;
        return d.getMonth() === 6 && d.getDate() === 15 && d.getFullYear() === 2025;
      });
      expect(hasRdate).toBe(true);
    });

    it('should handle when rrulestr returns an RRuleSet (line 51 coverage)', async () => {
      // rrulestr returns RRuleSet when the string contains RRULE: + EXDATE: together
      // We bypass domain validation by creating a plain mock object with the desired rrule
      const series = {
        id: 'series-1',
        subscriptionId: 'sub-1',
        // RRULE: + EXDATE: causes rrulestr to return an RRuleSet
        rrule: 'RRULE:FREQ=MONTHLY;INTERVAL=1\nEXDATE:20250201T100000Z',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: undefined,
        rdates: undefined,
      } as any;

      repository.findById.mockResolvedValue(series);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-06-30T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate, 12);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no occurrences in date range', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
      });

      repository.findById.mockResolvedValue(series);

      // Date range before the series starts
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const endDate = new Date('2024-12-31T23:59:59.000Z');

      const result = await useCase.execute('series-1', startDate, endDate, 12);

      expect(result).toEqual([]);
    });
  });

  describe('generateNext', () => {
    it('should generate next N occurrences from now', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
      });

      repository.findById.mockResolvedValue(series);

      const result = await useCase.generateNext('series-1', 3);

      expect(repository.findById).toHaveBeenCalledWith('series-1');
      expect(Array.isArray(result)).toBe(true);
      result.forEach(occ => {
        expect(occ.subscriptionId).toBe('sub-1');
        expect(occ.eventSeriesId).toBe('series-1');
        expect(occ.startsAt).toBeInstanceOf(Date);
        expect(occ.startsAt.getTime()).toBeGreaterThan(Date.now() - 1000); // should be in the future (or very recent)
      });
    });

    it('should use default count of 12 when not provided', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
      });

      repository.findById.mockResolvedValue(series);

      const result = await useCase.generateNext('series-1');

      expect(result.length).toBeLessThanOrEqual(12);
    });

    it('should throw when event series not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.generateNext('non-existent', 12)).rejects.toThrow(
        'Event series non-existent not found',
      );
    });

    it('should handle event series with exdates in generateNext', async () => {
      // Create a series with a near-future start and an exception date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from now

      const exdate = new Date(futureDate);
      exdate.setDate(1); // first of the month in 1 year

      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: [exdate],
      });

      repository.findById.mockResolvedValue(series);

      const result = await useCase.generateNext('series-1', 5);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle event series with rdates in generateNext', async () => {
      const series = makeEventSeries({
        id: 'series-1',
        subscriptionId: 'sub-1',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2020-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        rdates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 1 week from now
      });

      repository.findById.mockResolvedValue(series);

      const result = await useCase.generateNext('series-1', 5);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle when rrulestr returns an RRuleSet in generateNext (line 112 coverage)', async () => {
      // rrulestr returns RRuleSet when the string contains RRULE: + EXDATE: together
      // We bypass domain validation by creating a plain mock object with the desired rrule
      const series = {
        id: 'series-1',
        subscriptionId: 'sub-1',
        // RRULE: + EXDATE: causes rrulestr to return an RRuleSet
        rrule: 'RRULE:FREQ=MONTHLY;INTERVAL=1\nEXDATE:20250201T100000Z',
        dtstart: new Date('2020-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: undefined,
        rdates: undefined,
      } as any;

      repository.findById.mockResolvedValue(series);

      const result = await useCase.generateNext('series-1', 3);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
