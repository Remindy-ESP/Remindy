import { validate } from 'class-validator';
import { AdminReprocessOcrDto } from './admin-reprocess-ocr.dto';
import { describeForceBooleanValidation } from 'src/utils/__tests__/boolean-dto-validation.helper';

describe('AdminReprocessOcrDto', () => {
  it('should accept empty dto with default force=false', async () => {
    const dto = new AdminReprocessOcrDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.force).toBe(false);
  });

  describeForceBooleanValidation(AdminReprocessOcrDto);
});
