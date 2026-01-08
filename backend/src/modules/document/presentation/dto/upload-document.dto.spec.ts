import { validate } from 'class-validator';
import { UploadDocumentDto } from './upload-document.dto';
import { plainToClass } from 'class-transformer';

describe('UploadDocumentDto', () => {
  describe('validation', () => {
    it('should accept valid upload data with subscription_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        subscription_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      const subscriptionErrors = errors.filter(e => e.property === 'subscription_id');
      expect(subscriptionErrors).toHaveLength(0);
    });

    it('should accept valid upload data with contract_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        contract_id: 1,
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      const contractErrors = errors.filter(e => e.property === 'contract_id');
      expect(contractErrors).toHaveLength(0);
    });

    it('should accept upload data without optional fields', async () => {
      const plain = {
        file: {} as Express.Multer.File,
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid UUID for subscription_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        subscription_id: 'invalid-uuid',
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      const subscriptionError = errors.find(e => e.property === 'subscription_id');
      expect(subscriptionError).toBeDefined();
      expect(subscriptionError?.constraints).toHaveProperty('isUuid');
    });

    it('should reject non-integer contract_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        contract_id: 'not-a-number',
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      const contractError = errors.find(e => e.property === 'contract_id');
      expect(contractError).toBeDefined();
    });

    it('should transform string number to integer for contract_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        contract_id: '123',
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      expect(dto.contract_id).toBe(123);
      expect(typeof dto.contract_id).toBe('number');

      const contractErrors = errors.filter(e => e.property === 'contract_id');
      expect(contractErrors).toHaveLength(0);
    });

    it('should accept both subscription_id and contract_id', async () => {
      const plain = {
        file: {} as Express.Multer.File,
        subscription_id: '123e4567-e89b-12d3-a456-426614174000',
        contract_id: 1,
      };

      const dto = plainToClass(UploadDocumentDto, plain);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.subscription_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.contract_id).toBe(1);
    });
  });
});
