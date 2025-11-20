import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateSubscriptionDto } from './update-subscription.dto';

describe('UpdateSubscriptionDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    const dto = plainToClass(UpdateSubscriptionDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(UpdateSubscriptionDto, {
      contractId: 2,
      name: 'Netflix Premium',
      amount: 19.99,
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2025-01-01',
      nextDueDate: '2025-02-01',
      status: 'active',
      color: '#0000FF',
      notes: 'Updated',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate partial updates', async () => {
    const dto = plainToClass(UpdateSubscriptionDto, {
      amount: 14.99,
      status: 'paused',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if color format is invalid', async () => {
    const dto = plainToClass(UpdateSubscriptionDto, {
      color: 'not-a-hex',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
