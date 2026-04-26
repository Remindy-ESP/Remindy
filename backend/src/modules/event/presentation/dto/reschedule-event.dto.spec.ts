import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { RescheduleEventDto } from './reschedule-event.dto';

describe('RescheduleEventDto', () => {
  it('should validate a valid reschedule DTO', async () => {
    const dto = plainToClass(RescheduleEventDto, {
      starts_at: '2025-02-01T10:00:00.000Z',
      ends_at: '2025-02-01T11:00:00.000Z',
      notes: 'Rescheduled',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with only starts_at', async () => {
    const dto = plainToClass(RescheduleEventDto, {
      starts_at: '2025-02-01T10:00:00.000Z',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
