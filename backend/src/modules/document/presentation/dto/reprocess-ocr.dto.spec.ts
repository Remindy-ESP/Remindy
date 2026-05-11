import { validate } from 'class-validator';
import { ReprocessOcrDto } from './reprocess-ocr.dto';
import {
  describeForceBooleanValidation,
  validateForceField,
} from 'src/utils/__tests__/boolean-dto-validation.helper';

describe('ReprocessOcrDto', () => {
  describe('validation', () => {
    it('should accept empty dto', async () => {
      const dto = new ReprocessOcrDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    describeForceBooleanValidation(ReprocessOcrDto);

    it('should reject number as force value', async () => {
      const { errors } = await validateForceField(ReprocessOcrDto, 1);

      const forceError = errors.find(e => e.property === 'force');
      expect(forceError).toBeDefined();
      expect(forceError?.constraints).toHaveProperty('isBoolean');
    });

    it('should handle undefined force value', async () => {
      const { dto, errors } = await validateForceField(ReprocessOcrDto, undefined);

      expect(errors).toHaveLength(0);
      expect(dto.force).toBeUndefined();
    });
  });
});
