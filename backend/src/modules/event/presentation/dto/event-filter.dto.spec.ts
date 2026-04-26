import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EventFilterDto } from './event-filter.dto';

describe('EventFilterDto', () => {
  it('should validate an empty filter', async () => {
    const dto = plainToClass(EventFilterDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(EventFilterDto, {
      start: '2025-01-01',
      end: '2025-12-31',
      subscription_id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'scheduled',
      payment_status: 'pending',
      limit: 100,
      sort: 'starts_at:desc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate all event statuses', async () => {
    const statuses = ['scheduled', 'completed', 'canceled', 'failed'];
    for (const status of statuses) {
      const dto = plainToClass(EventFilterDto, { status });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});
