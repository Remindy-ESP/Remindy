import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateSubscriptionDto } from './create-subscription.dto';

describe('CreateSubscriptionDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToClass(CreateSubscriptionDto, {
      userId: 'user-123',
      name: 'Netflix',
      amount: 9.99,
      frequency: 'monthly',
      startDate: '2025-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(CreateSubscriptionDto, {
      userId: 'user-123',
      contractId: 1,
      name: 'Netflix Premium',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: '2025-01-01',
      nextDueDate: '2025-02-01',
      trialStartDate: '2024-12-01',
      trialEndDate: '2024-12-31',
      status: 'active',
      color: '#FF0000',
      notes: 'Premium subscription',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if userId is missing', async () => {
    const dto = plainToClass(CreateSubscriptionDto, {
      name: 'Netflix',
      amount: 9.99,
      frequency: 'monthly',
      startDate: '2025-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if name is missing', async () => {
    const dto = plainToClass(CreateSubscriptionDto, {
      userId: 'user-123',
      amount: 9.99,
      frequency: 'monthly',
      startDate: '2025-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate all valid frequencies', async () => {
    const frequencies = ['weekly', 'monthly', 'quarterly', 'yearly'];
    for (const frequency of frequencies) {
      const dto = plainToClass(CreateSubscriptionDto, {
        userId: 'user-123',
        name: 'Test',
        amount: 10,
        frequency,
        startDate: '2025-01-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should validate all valid statuses', async () => {
    const statuses = ['active', 'paused', 'cancelled', 'trial'];
    for (const status of statuses) {
      const dto = plainToClass(CreateSubscriptionDto, {
        userId: 'user-123',
        name: 'Test',
        amount: 10,
        frequency: 'monthly',
        startDate: '2025-01-01',
        status,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail if color format is invalid', async () => {
    const dto = plainToClass(CreateSubscriptionDto, {
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      frequency: 'monthly',
      startDate: '2025-01-01',
      color: 'invalid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
