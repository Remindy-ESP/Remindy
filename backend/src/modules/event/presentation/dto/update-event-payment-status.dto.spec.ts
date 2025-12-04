import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateEventPaymentStatusDto } from './update-event-payment-status.dto';

describe('UpdateEventPaymentStatusDto', () => {
  it('should validate all valid payment statuses', async () => {
    const statuses = ['pending', 'paid', 'failed'];
    for (const paymentStatus of statuses) {
      const dto = plainToClass(UpdateEventPaymentStatusDto, { paymentStatus });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail if paymentStatus is invalid', async () => {
    const dto = plainToClass(UpdateEventPaymentStatusDto, { paymentStatus: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
