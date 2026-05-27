import { validate } from 'class-validator';
import { CreateRgpdExportDto } from './rgpd-export.dto';

describe('CreateRgpdExportDto', () => {
  it('accepts supported formats', async () => {
    for (const format of ['json', 'csv'] as const) {
      const dto = new CreateRgpdExportDto();
      dto.format = format;

      await expect(validate(dto)).resolves.toHaveLength(0);
    }
  });

  it('rejects unsupported formats', async () => {
    const dto = new CreateRgpdExportDto();
    dto.format = 'xml' as any;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('format');
  });
});
