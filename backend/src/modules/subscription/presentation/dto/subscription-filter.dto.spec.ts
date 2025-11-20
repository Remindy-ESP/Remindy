import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SubscriptionFilterDto } from './subscription-filter.dto';

describe('SubscriptionFilterDto', () => {
  it('should validate an empty filter', async () => {
    const dto = plainToClass(SubscriptionFilterDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(SubscriptionFilterDto, {
      userId: 'user-123',
      contractId: 1,
      name: 'Netflix',
      currency: 'EUR',
      frequency: 'monthly',
      status: 'active',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
