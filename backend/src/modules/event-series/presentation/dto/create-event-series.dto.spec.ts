import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEventSeriesDto } from './create-event-series.dto';

describe('CreateEventSeriesDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToClass(CreateEventSeriesDto, {
      subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      dtstart: '2025-01-01T10:00:00.000Z',
      timezone: 'Europe/Paris',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with optional fields', async () => {
    const dto = plainToClass(CreateEventSeriesDto, {
      subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
      rrule: 'FREQ=WEEKLY',
      dtstart: '2025-01-01T10:00:00.000Z',
      exdates: ['2025-02-01T10:00:00.000Z'],
      rdates: ['2025-03-01T10:00:00.000Z'],
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if required fields are missing', async () => {
    const dto = plainToClass(CreateEventSeriesDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
