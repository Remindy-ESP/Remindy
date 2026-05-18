import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RgpdExportsQueryDto } from './rgpd-exports-query.dto';

describe('RgpdExportsQueryDto', () => {
  it('transforms and validates a valid payload', () => {
    const dto = plainToInstance(RgpdExportsQueryDto, {
      status: 'completed',
      requestedBy: 'admin',
      page: '2',
      limit: '30',
    });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(30);
  });

  it('rejects invalid values', () => {
    const dto = plainToInstance(RgpdExportsQueryDto, {
      userId: 'bad',
      status: 'x',
      requestedBy: 'x',
      limit: '101',
    });
    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['userId', 'status', 'requestedBy', 'limit']));
  });
});
