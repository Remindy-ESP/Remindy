import { validate } from 'class-validator';
import { DocumentFilterDto } from './document-filter.dto';
import { plainToClass } from 'class-transformer';

describe('DocumentFilterDto', () => {
  describe('validation', () => {
    it('should accept empty filter', async () => {
      const dto = new DocumentFilterDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept valid subscription_id UUID', async () => {
      const plain = {
        subscription_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const subscriptionErrors = errors.filter(e => e.property === 'subscription_id');
      expect(subscriptionErrors).toHaveLength(0);
    });

    it('should reject invalid subscription_id UUID', async () => {
      const plain = {
        subscription_id: 'invalid-uuid',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const subscriptionError = errors.find(e => e.property === 'subscription_id');
      expect(subscriptionError).toBeDefined();
      expect(subscriptionError?.constraints).toHaveProperty('isUuid');
    });

    it('should accept valid contract_id', async () => {
      const plain = {
        contract_id: 123,
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const contractErrors = errors.filter(e => e.property === 'contract_id');
      expect(contractErrors).toHaveLength(0);
    });

    it('should accept valid ocr_status values', async () => {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];

      for (const status of validStatuses) {
        const plain = { ocr_status: status };
        const dto = plainToClass(DocumentFilterDto, plain);
        const errors = await validate(dto);

        const statusErrors = errors.filter(e => e.property === 'ocr_status');
        expect(statusErrors).toHaveLength(0);
      }
    });

    it('should reject invalid ocr_status', async () => {
      const plain = {
        ocr_status: 'invalid-status',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const statusError = errors.find(e => e.property === 'ocr_status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should accept valid mime_type values', async () => {
      const validMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];

      for (const mimeType of validMimeTypes) {
        const plain = { mime_type: mimeType };
        const dto = plainToClass(DocumentFilterDto, plain);
        const errors = await validate(dto);

        const mimeErrors = errors.filter(e => e.property === 'mime_type');
        expect(mimeErrors).toHaveLength(0);
      }
    });

    it('should reject invalid mime_type', async () => {
      const plain = {
        mime_type: 'text/plain',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const mimeError = errors.find(e => e.property === 'mime_type');
      expect(mimeError).toBeDefined();
      expect(mimeError?.constraints).toHaveProperty('isEnum');
    });

    it('should accept valid limit within range', async () => {
      const validLimits = [1, 50, 100, 500, 1000];

      for (const limit of validLimits) {
        const plain = { limit };
        const dto = plainToClass(DocumentFilterDto, plain);
        const errors = await validate(dto);

        const limitErrors = errors.filter(e => e.property === 'limit');
        expect(limitErrors).toHaveLength(0);
      }
    });

    it('should reject limit below minimum', async () => {
      const plain = {
        limit: 0,
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const limitError = errors.find(e => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints).toHaveProperty('min');
    });

    it('should reject limit above maximum', async () => {
      const plain = {
        limit: 1001,
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      const limitError = errors.find(e => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints).toHaveProperty('max');
    });

    it('should transform string limit to number', async () => {
      const plain = {
        limit: '100',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      expect(dto.limit).toBe(100);
      expect(typeof dto.limit).toBe('number');

      const limitErrors = errors.filter(e => e.property === 'limit');
      expect(limitErrors).toHaveLength(0);
    });

    it('should accept valid sort values', async () => {
      const validSorts = ['uploaded_at:asc', 'uploaded_at:desc'];

      for (const sort of validSorts) {
        const plain = { sort };
        const dto = plainToClass(DocumentFilterDto, plain);
        const errors = await validate(dto);

        const sortErrors = errors.filter(e => e.property === 'sort');
        expect(sortErrors).toHaveLength(0);
      }
    });

    it('should accept multiple filters combined', async () => {
      const plain = {
        subscription_id: '123e4567-e89b-12d3-a456-426614174000',
        ocr_status: 'completed',
        mime_type: 'application/pdf',
        limit: 50,
        sort: 'uploaded_at:desc',
      };

      const dto = plainToClass(DocumentFilterDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.subscription_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.ocr_status).toBe('completed');
      expect(dto.mime_type).toBe('application/pdf');
      expect(dto.limit).toBe(50);
      expect(dto.sort).toBe('uploaded_at:desc');
    });
  });
});
