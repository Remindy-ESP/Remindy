import { EventSeriesResponseDto } from './event-series-response.dto';

describe('EventSeriesResponseDto', () => {
  it('should create a response DTO', () => {
    const dto: EventSeriesResponseDto = {
      id: 'series-123',
      subscriptionId: 'sub-123',
      rrule: 'FREQ=MONTHLY',
      dtstart: new Date('2025-01-01'),
      timezone: 'Europe/Paris',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(dto.id).toBe('series-123');
    expect(dto.rrule).toBe('FREQ=MONTHLY');
  });
});
