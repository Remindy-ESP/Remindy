import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminSubscriptionsQueryDto } from './admin-subscriptions-query.dto';

describe('AdminSubscriptionsQueryDto', () => {
  it('applies defaults and numeric transforms', () => {
    const dto = plainToInstance(AdminSubscriptionsQueryDto, {
      amountMin: '5',
      amountMax: '10',
      page: '2',
      limit: '3',
    });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.amountMin).toBe(5);
    expect(dto.amountMax).toBe(10);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(3);
  });

  it('rejects invalid enum values', () => {
    const dto = plainToInstance(AdminSubscriptionsQueryDto, { status: 'oops', frequency: 'oops' });
    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['status', 'frequency']));
  });
});
