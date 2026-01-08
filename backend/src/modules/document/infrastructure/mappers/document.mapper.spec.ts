import { DocumentMapper } from './document.mapper';
import { Document } from '../../domain/document.entity';
import { DocumentEntity } from '../persistence/document.entity';

describe('DocumentMapper', () => {
  describe('toDomain', () => {
    it('should map entity to domain document', () => {
      const entity = new DocumentEntity();
      entity.id = 'doc-123';
      entity.userId = 'user-123';
      entity.subscriptionId = 'sub-123';
      entity.contractId = 1;
      entity.filename = 'test.pdf';
      entity.r2Key = 'documents/test.pdf';
      entity.r2Bucket = 'my-bucket';
      entity.fileHash = 'hash123';
      entity.fileSize = 1024;
      entity.mimeType = 'application/pdf';
      entity.ocrText = 'Extracted text';
      entity.ocrStatus = 'completed';
      entity.ocrError = null;
      entity.uploadedAt = new Date('2024-01-01');
      entity.updatedAt = new Date('2024-01-15');
      entity.deletedAt = undefined;

      const domain = DocumentMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Document);
      expect(domain.id).toBe('doc-123');
      expect(domain.userId).toBe('user-123');
      expect(domain.subscriptionId).toBe('sub-123');
      expect(domain.contractId).toBe(1);
      expect(domain.filename).toBe('test.pdf');
      expect(domain.r2Key).toBe('documents/test.pdf');
      expect(domain.r2Bucket).toBe('my-bucket');
      expect(domain.fileHash).toBe('hash123');
      expect(domain.fileSize).toBe(1024);
      expect(domain.mimeType).toBe('application/pdf');
      expect(domain.ocrText).toBe('Extracted text');
      expect(domain.ocrStatus).toBe('completed');
      expect(domain.ocrError).toBeUndefined();
      expect(domain.uploadedAt).toEqual(new Date('2024-01-01'));
      expect(domain.updatedAt).toEqual(new Date('2024-01-15'));
      expect(domain.deletedAt).toBeUndefined();
    });

    it('should handle entity with null optional fields', () => {
      const entity = new DocumentEntity();
      entity.id = 'doc-456';
      entity.userId = 'user-456';
      entity.subscriptionId = undefined;
      entity.contractId = undefined;
      entity.filename = 'image.png';
      entity.r2Key = 'documents/image.png';
      entity.r2Bucket = 'my-bucket';
      entity.fileHash = 'hash456';
      entity.fileSize = 2048;
      entity.mimeType = 'image/png';
      entity.ocrText = undefined;
      entity.ocrStatus = 'pending';
      entity.ocrError = undefined;
      entity.uploadedAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = undefined;

      const domain = DocumentMapper.toDomain(entity);

      expect(domain.subscriptionId).toBeUndefined();
      expect(domain.contractId).toBeUndefined();
      expect(domain.ocrText).toBeUndefined();
    });

    it('should handle entity with OCR error', () => {
      const entity = new DocumentEntity();
      entity.id = 'doc-789';
      entity.userId = 'user-789';
      entity.subscriptionId = null;
      entity.contractId = null;
      entity.filename = 'failed.pdf';
      entity.r2Key = 'documents/failed.pdf';
      entity.r2Bucket = 'my-bucket';
      entity.fileHash = 'hash789';
      entity.fileSize = 512;
      entity.mimeType = 'application/pdf';
      entity.ocrText = null;
      entity.ocrStatus = 'failed';
      entity.ocrError = 'OCR processing failed';
      entity.uploadedAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;

      const domain = DocumentMapper.toDomain(entity);

      expect(domain.ocrStatus).toBe('failed');
      expect(domain.ocrError).toBe('OCR processing failed');
    });
  });

  describe('toPersistence', () => {
    it('should map domain document to entity', () => {
      const domain = new Document({
        id: 'doc-123',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        contractId: 1,
        filename: 'test.pdf',
        r2Key: 'documents/test.pdf',
        r2Bucket: 'my-bucket',
        fileHash: 'hash123',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrText: 'Extracted text',
        ocrStatus: 'completed',
        ocrError: null,
        uploadedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        deletedAt: null,
      });

      const entity = DocumentMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(DocumentEntity);
      expect(entity.id).toBe('doc-123');
      expect(entity.userId).toBe('user-123');
      expect(entity.subscriptionId).toBe('sub-123');
      expect(entity.contractId).toBe(1);
      expect(entity.filename).toBe('test.pdf');
      expect(entity.r2Key).toBe('documents/test.pdf');
      expect(entity.r2Bucket).toBe('my-bucket');
      expect(entity.fileHash).toBe('hash123');
      expect(entity.fileSize).toBe(1024);
      expect(entity.mimeType).toBe('application/pdf');
      expect(entity.ocrText).toBe('Extracted text');
      expect(entity.ocrStatus).toBe('completed');
      expect(entity.ocrError).toBeUndefined();
    });

    it('should not set id if domain id is undefined', () => {
      const domain = new Document({
        userId: 'user-456',
        subscriptionId: null,
        contractId: null,
        filename: 'new.pdf',
        r2Key: 'documents/new.pdf',
        r2Bucket: 'my-bucket',
        fileHash: 'hash456',
        fileSize: 2048,
        mimeType: 'application/pdf',
        ocrText: null,
        ocrStatus: 'pending',
        ocrError: null,
      });

      const entity = DocumentMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBe('user-456');
    });

    it('should handle domain with null optional fields', () => {
      const domain = new Document({
        userId: 'user-789',
        subscriptionId: undefined,
        contractId: undefined,
        filename: 'image.jpg',
        r2Key: 'documents/image.jpg',
        r2Bucket: 'my-bucket',
        fileHash: 'hash789',
        fileSize: 512,
        mimeType: 'image/jpeg',
        ocrText: undefined,
        ocrStatus: 'pending',
        ocrError: undefined,
      });

      const entity = DocumentMapper.toPersistence(domain);

      expect(entity.subscriptionId).toBeUndefined();
      expect(entity.contractId).toBeUndefined();
      expect(entity.ocrText).toBeUndefined();
    });
  });

  describe('toDomainArray', () => {
    it('should map array of entities to array of domain documents', () => {
      const entities = [
        Object.assign(new DocumentEntity(), {
          id: 'doc-1',
          userId: 'user-1',
          filename: 'file1.pdf',
          r2Key: 'documents/file1.pdf',
          r2Bucket: 'bucket',
          fileHash: 'hash1',
          fileSize: 100,
          mimeType: 'application/pdf',
          ocrStatus: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        }),
        Object.assign(new DocumentEntity(), {
          id: 'doc-2',
          userId: 'user-2',
          filename: 'file2.pdf',
          r2Key: 'documents/file2.pdf',
          r2Bucket: 'bucket',
          fileHash: 'hash2',
          fileSize: 200,
          mimeType: 'application/pdf',
          ocrStatus: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const domains = DocumentMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Document);
      expect(domains[1]).toBeInstanceOf(Document);
      expect(domains[0].id).toBe('doc-1');
      expect(domains[1].id).toBe('doc-2');
    });

    it('should return empty array for empty input', () => {
      const domains = DocumentMapper.toDomainArray([]);

      expect(domains).toEqual([]);
    });
  });
});
