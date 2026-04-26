import { EventSeriesPresentationMapper } from './event-series-presentation.mapper';
import { EventSeries } from '../../domain/event-series.entity';
import { CreateEventSeriesDto } from '../dto/create-event-series.dto';

describe('EventSeriesPresentationMapper', () => {
  describe('toCreateAppDto', () => {
    it('should map CreateEventSeriesDto to CreateEventSeriesAppDto', () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: '2025-01-01T10:00:00.000Z',
        timezone: 'America/New_York',
        exdates: ['2025-02-01T10:00:00.000Z', '2025-03-01T10:00:00.000Z'],
        rdates: ['2025-04-01T10:00:00.000Z'],
      };

      const appDto = EventSeriesPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.subscriptionId).toBe('sub-123');
      expect(appDto.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
      expect(appDto.dtstart).toEqual(new Date('2025-01-01T10:00:00.000Z'));
      expect(appDto.timezone).toBe('America/New_York');
      expect(appDto.exdates).toHaveLength(2);
      expect(appDto.exdates![0]).toEqual(new Date('2025-02-01T10:00:00.000Z'));
      expect(appDto.rdates).toHaveLength(1);
      expect(appDto.rdates![0]).toEqual(new Date('2025-04-01T10:00:00.000Z'));
    });

    it('should use default timezone when not provided', () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'sub-456',
        rrule: 'FREQ=WEEKLY',
        dtstart: '2025-01-01T10:00:00.000Z',
      };

      const appDto = EventSeriesPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.timezone).toBe('Europe/Paris');
    });

    it('should handle optional exdates and rdates', () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'sub-789',
        rrule: 'FREQ=YEARLY',
        dtstart: '2025-01-01T10:00:00.000Z',
        timezone: 'UTC',
      };

      const appDto = EventSeriesPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.exdates).toBeUndefined();
      expect(appDto.rdates).toBeUndefined();
    });
  });

  describe('toResponseDto', () => {
    it('should map EventSeries domain to EventSeriesResponseDto', () => {
      const domain = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'Europe/Paris',
        exdates: [new Date('2025-02-01'), new Date('2025-03-01')],
        rdates: [new Date('2025-04-01')],
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = EventSeriesPresentationMapper.toResponseDto(domain);

      expect(dto.id).toBe('series-123');
      expect(dto.subscriptionId).toBe('sub-123');
      expect(dto.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
      expect(dto.dtstart).toEqual(new Date('2025-01-01T10:00:00.000Z'));
      expect(dto.timezone).toBe('Europe/Paris');
      expect(dto.exdates).toEqual([new Date('2025-02-01'), new Date('2025-03-01')]);
      expect(dto.rdates).toEqual([new Date('2025-04-01')]);
      expect(dto.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
      expect(dto.updatedAt).toEqual(new Date('2025-01-02T10:00:00.000Z'));
    });

    it('should map EventSeries without optional fields', () => {
      const domain = new EventSeries({
        id: 'series-456',
        subscriptionId: 'sub-456',
        rrule: 'FREQ=WEEKLY',
        dtstart: new Date('2025-01-01T10:00:00.000Z'),
        timezone: 'UTC',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = EventSeriesPresentationMapper.toResponseDto(domain);

      expect(dto.exdates).toBeUndefined();
      expect(dto.rdates).toBeUndefined();
    });
  });
});
