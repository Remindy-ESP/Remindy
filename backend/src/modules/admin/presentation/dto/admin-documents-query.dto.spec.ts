import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminDocumentsQueryDto } from './admin-documents-query.dto';

describe('AdminDocumentsQueryDto', () => {
  it('applies defaults and numeric transforms', () => {
    const dto = plainToInstance(AdminDocumentsQueryDto, { page: '2', limit: '3' });
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(3);
    expect(new AdminDocumentsQueryDto().sortBy).toBe('uploadedAt');
    expect(new AdminDocumentsQueryDto().sortDir).toBe('DESC');
  });

  it('rejects invalid values', () => {
    const dto = plainToInstance(AdminDocumentsQueryDto, { userId: 'bad', ocrStatus: 'weird' });
    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['userId', 'ocrStatus']));
  });
});
