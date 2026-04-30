import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AdminReprocessOcrDto } from './admin-reprocess-ocr.dto';

describe('AdminReprocessOcrDto', () => {
  it('should accept empty dto with default force=false', async () => {
    const dto = new AdminReprocessOcrDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.force).toBe(false);
  });

  it('should accept force as true', async () => {
    const dto = plainToClass(AdminReprocessOcrDto, { force: true });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.force).toBe(true);
  });

  it('should accept force as false', async () => {
    const dto = plainToClass(AdminReprocessOcrDto, { force: false });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.force).toBe(false);
  });

  it('should reject non-boolean force', async () => {
    const dto = plainToClass(AdminReprocessOcrDto, { force: 'yes' });
    const errors = await validate(dto);

    const forceError = errors.find(e => e.property === 'force');
    expect(forceError).toBeDefined();
    expect(forceError?.constraints).toHaveProperty('isBoolean');
  });
});
