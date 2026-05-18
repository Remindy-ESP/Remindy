import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminAuditQueryDto } from './admin-audit-query.dto';

describe('AdminAuditQueryDto', () => {
  it('uses defaults and transforms booleans/numbers', () => {
    const dto = plainToInstance(AdminAuditQueryDto, { success: 'true', page: '2', limit: '10' });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.success).toBe(true);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
    expect(new AdminAuditQueryDto().sortBy).toBe('createdAt');
    expect(new AdminAuditQueryDto().sortOrder).toBe('DESC');
  });

  it('maps non true success values to false and keeps numeric defaults', () => {
    const dto = plainToInstance(AdminAuditQueryDto, { success: 'false' });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.success).toBe(false);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(50);
  });

  it('rejects invalid values', () => {
    const dto = plainToInstance(AdminAuditQueryDto, {
      actor: 'bad',
      severity: 'fatal',
      from: 'x',
      to: 'y',
    });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['actor', 'severity', 'from', 'to']));
  });
});
