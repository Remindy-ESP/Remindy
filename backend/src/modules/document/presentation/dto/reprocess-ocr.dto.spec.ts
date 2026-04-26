import { validate } from 'class-validator';
import { ReprocessOcrDto } from './reprocess-ocr.dto';
import { plainToClass } from 'class-transformer';

describe('ReprocessOcrDto', () => {
  describe('validation', () => {
    it('should accept empty dto', async () => {
      const dto = new ReprocessOcrDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept force as true', async () => {
      const plain = {
        force: true,
      };

      const dto = plainToClass(ReprocessOcrDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBe(true);
    });

    it('should accept force as false', async () => {
      const plain = {
        force: false,
      };

      const dto = plainToClass(ReprocessOcrDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBe(false);
    });

    it('should reject non-boolean force value', async () => {
      const plain = {
        force: 'not-a-boolean',
      };

      const dto = plainToClass(ReprocessOcrDto, plain);
      const errors = await validate(dto);

      const forceError = errors.find(e => e.property === 'force');
      expect(forceError).toBeDefined();
      expect(forceError?.constraints).toHaveProperty('isBoolean');
    });

    it('should reject number as force value', async () => {
      const plain = {
        force: 1,
      };

      const dto = plainToClass(ReprocessOcrDto, plain);
      const errors = await validate(dto);

      const forceError = errors.find(e => e.property === 'force');
      expect(forceError).toBeDefined();
      expect(forceError?.constraints).toHaveProperty('isBoolean');
    });

    it('should handle undefined force value', async () => {
      const plain = {
        force: undefined,
      };

      const dto = plainToClass(ReprocessOcrDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBeUndefined();
    });
  });
});
