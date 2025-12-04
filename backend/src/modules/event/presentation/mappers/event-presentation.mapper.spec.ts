import { EventPresentationMapper } from './event-presentation.mapper';
import { Event } from '../../domain/event.entity';
import { EventFilterDto } from '../dto/event-filter.dto';
import { RescheduleEventDto } from '../dto/reschedule-event.dto';

describe('EventPresentationMapper', () => {
  describe('toResponseDto', () => {
    it('should map Event domain to EventResponseDto', () => {
      const event = new Event({
        id: 'event-123',
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-123',
        title: 'Monthly Payment',
        amount: 29.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        endsAt: new Date('2025-02-01T11:00:00.000Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = EventPresentationMapper.toResponseDto(event);

      expect(dto.id).toBe('event-123');
      expect(dto.subscriptionId).toBe('sub-123');
      expect(dto.eventSeriesId).toBe('series-123');
      expect(dto.title).toBe('Monthly Payment');
      expect(dto.amount).toBe(29.99);
      expect(dto.startsAt).toBe('2025-02-01T10:00:00.000Z');
      expect(dto.endsAt).toBe('2025-02-01T11:00:00.000Z');
      expect(dto.status).toBe('scheduled');
      expect(dto.paymentStatus).toBe('pending');
      expect(dto.notes).toBe('Test notes');
      expect(dto.createdAt).toBe('2025-01-01T10:00:00.000Z');
      expect(dto.updatedAt).toBe('2025-01-02T10:00:00.000Z');
    });

    it('should map Event without optional fields', () => {
      const event = new Event({
        id: 'event-456',
        subscriptionId: 'sub-456',
        title: 'Simple Event',
        amount: 19.99,
        startsAt: new Date('2025-02-01T10:00:00.000Z'),
        status: 'completed',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = EventPresentationMapper.toResponseDto(event);

      expect(dto.eventSeriesId).toBeUndefined();
      expect(dto.endsAt).toBeUndefined();
      expect(dto.paymentStatus).toBeUndefined();
      expect(dto.notes).toBeUndefined();
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Events to array of EventResponseDto', () => {
      const events = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-1',
          title: 'Event 1',
          amount: 10,
          startsAt: new Date(),
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-2',
          title: 'Event 2',
          amount: 20,
          startsAt: new Date(),
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const dtos = EventPresentationMapper.toResponseDtoArray(events);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('event-1');
      expect(dtos[1].id).toBe('event-2');
    });
  });

  describe('toFilterAppDto', () => {
    it('should map EventFilterDto to EventFilterAppDto', () => {
      const filterDto: EventFilterDto = {
        start: '2025-01-01T00:00:00.000Z',
        end: '2025-12-31T23:59:59.999Z',
        subscription_id: 'sub-123',
        status: 'scheduled',
        payment_status: 'pending',
        limit: 50,
        sort: 'starts_at:desc',
      };

      const appDto = EventPresentationMapper.toFilterAppDto(filterDto);

      expect(appDto.start).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(appDto.end).toEqual(new Date('2025-12-31T23:59:59.999Z'));
      expect(appDto.subscriptionId).toBe('sub-123');
      expect(appDto.status).toBe('scheduled');
      expect(appDto.paymentStatus).toBe('pending');
      expect(appDto.limit).toBe(50);
      expect(appDto.sort).toBe('starts_at:desc');
    });

    it('should use default values when not provided', () => {
      const filterDto: EventFilterDto = {};

      const appDto = EventPresentationMapper.toFilterAppDto(filterDto);

      expect(appDto.start).toBeUndefined();
      expect(appDto.end).toBeUndefined();
      expect(appDto.limit).toBe(100);
      expect(appDto.sort).toBe('starts_at:asc');
    });
  });

  describe('toRescheduleAppDto', () => {
    it('should map RescheduleEventDto to RescheduleEventAppDto', () => {
      const rescheduleDto: RescheduleEventDto = {
        starts_at: '2025-02-15T10:00:00.000Z',
        ends_at: '2025-02-15T11:00:00.000Z',
        notes: 'Rescheduled',
      };

      const appDto = EventPresentationMapper.toRescheduleAppDto(rescheduleDto);

      expect(appDto.startsAt).toEqual(new Date('2025-02-15T10:00:00.000Z'));
      expect(appDto.endsAt).toEqual(new Date('2025-02-15T11:00:00.000Z'));
      expect(appDto.notes).toBe('Rescheduled');
    });

    it('should handle optional endsAt', () => {
      const rescheduleDto: RescheduleEventDto = {
        starts_at: '2025-02-15T10:00:00.000Z',
      };

      const appDto = EventPresentationMapper.toRescheduleAppDto(rescheduleDto);

      expect(appDto.startsAt).toEqual(new Date('2025-02-15T10:00:00.000Z'));
      expect(appDto.endsAt).toBeUndefined();
      expect(appDto.notes).toBeUndefined();
    });
  });
});
