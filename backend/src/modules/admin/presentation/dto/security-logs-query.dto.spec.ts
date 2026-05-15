import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SecurityLogsQueryDto } from './security-logs-query.dto';

describe('SecurityLogsQueryDto', () => {
  it('transforms boolean and number fields', () => {
    const dto = plainToInstance(SecurityLogsQueryDto, {
      isSuspicious: 'true',
      page: '2',
      limit: '10',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.isSuspicious).toBe(true);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('maps non true suspicious values to false and keeps defaults', () => {
    const dto = plainToInstance(SecurityLogsQueryDto, { isSuspicious: 'false' });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.isSuspicious).toBe(false);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(50);
  });

  it('rejects invalid uuid, ip and date values', () => {
    const dto = plainToInstance(SecurityLogsQueryDto, {
      userId: 'bad',
      ipAddress: 'bad',
      from: 'x',
      to: 'y',
    });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['userId', 'ipAddress', 'from', 'to']));
  });
});
