import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateEventStatusDto } from './update-event-status.dto';

describe('UpdateEventStatusDto', () => {
  it('should validate all valid event statuses', async () => {
    const statuses = ['scheduled', 'completed', 'canceled', 'failed'];
    for (const status of statuses) {
      const dto = plainToClass(UpdateEventStatusDto, { status });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail if status is invalid', async () => {
    const dto = plainToClass(UpdateEventStatusDto, { status: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
