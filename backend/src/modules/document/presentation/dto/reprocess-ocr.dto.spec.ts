import { validate } from 'class-validator';
import { ReprocessOcrDto } from './reprocess-ocr.dto';
import { plainToClass } from 'class-transformer';

// --- Test helper for validation ---
async function validateDtoForce(value: any) {
  const dto = plainToClass(ReprocessOcrDto, { force: value });
  const errors = await validate(dto);
  return { dto, errors };
}

describe('ReprocessOcrDto', () => {
  describe('validation', () => {
    it('should accept empty dto', async () => {
      const dto = new ReprocessOcrDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept force as true', async () => {
      const { dto, errors } = await validateDtoForce(true);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBe(true);
    });

    it('should accept force as false', async () => {
      const { dto, errors } = await validateDtoForce(false);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBe(false);
    });

    it('should reject non-boolean force value', async () => {
      const { errors } = await validateDtoForce('not-a-boolean');

      const forceError = errors.find(e => e.property === 'force');
      expect(forceError).toBeDefined();
      expect(forceError?.constraints).toHaveProperty('isBoolean');
    });

    it('should reject number as force value', async () => {
      const { errors } = await validateDtoForce(1);

      const forceError = errors.find(e => e.property === 'force');
      expect(forceError).toBeDefined();
      expect(forceError?.constraints).toHaveProperty('isBoolean');
    });

    it('should handle undefined force value', async () => {
      const { dto, errors } = await validateDtoForce(undefined);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBeUndefined();
    });
  });
});
