import { DocumentPresentationMapper } from './document-presentation.mapper';
import { Document } from '../../domain/document.entity';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { ReprocessOcrDto } from '../dto/reprocess-ocr.dto';

describe('DocumentPresentationMapper', () => {
  const mockDocument = new Document({
    id: 'doc-123',
    userId: 'user-123',
    subscriptionId: 'sub-123',
    contractId: 1,
    filename: 'test-document.pdf',
    r2Key: 'documents/test-document.pdf',
    r2Bucket: 'remindy-documents',
    fileHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    ocrText: 'Extracted text content',
    ocrStatus: 'completed',
    ocrError: undefined,
    uploadedAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:35:00Z'),
    deletedAt: undefined,
  });

  describe('toResponseDto', () => {
    it('should map Document to DocumentResponseDto', () => {
      const result = DocumentPresentationMapper.toResponseDto(mockDocument);

      expect(result).toEqual({
        id: 'doc-123',
        user_id: 'user-123',
        subscription_id: 'sub-123',
        contract_id: 1,
        filename: 'test-document.pdf',
        r2_key: 'documents/test-document.pdf',
        r2_bucket: 'remindy-documents',
        file_hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        file_size: 2048576,
        mime_type: 'application/pdf',
        ocr_text: 'Extracted text content',
        ocr_status: 'completed',
        ocr_error: undefined,
        uploaded_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:35:00.000Z',
        deleted_at: undefined,
      });
    });

    it('should map Document with optional fields as undefined', () => {
      const documentWithoutOptionals = new Document({
        id: 'doc-456',
        userId: 'user-456',
        filename: 'minimal.pdf',
        r2Key: 'documents/minimal.pdf',
        r2Bucket: 'bucket',
        fileHash: 'hash456',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
        uploadedAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:00:00Z'),
      });

      const result = DocumentPresentationMapper.toResponseDto(documentWithoutOptionals);

      expect(result.subscription_id).toBeUndefined();
      expect(result.contract_id).toBeUndefined();
      expect(result.ocr_text).toBeUndefined();
      expect(result.ocr_error).toBeUndefined();
      expect(result.deleted_at).toBeUndefined();
    });

    it('should format dates as ISO strings', () => {
      const result = DocumentPresentationMapper.toResponseDto(mockDocument);

      expect(typeof result.uploaded_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
      expect(result.uploaded_at).toBe('2025-01-15T10:30:00.000Z');
      expect(result.updated_at).toBe('2025-01-15T10:35:00.000Z');
    });

    it('should include deleted_at when present', () => {
      const deletedDocument = new Document({
        id: mockDocument.id,
        userId: mockDocument.userId,
        subscriptionId: mockDocument.subscriptionId,
        contractId: mockDocument.contractId,
        filename: mockDocument.filename,
        r2Key: mockDocument.r2Key,
        r2Bucket: mockDocument.r2Bucket,
        fileHash: mockDocument.fileHash,
        fileSize: mockDocument.fileSize,
        mimeType: mockDocument.mimeType,
        ocrText: mockDocument.ocrText,
        ocrStatus: mockDocument.ocrStatus,
        uploadedAt: mockDocument.uploadedAt,
        updatedAt: mockDocument.updatedAt,
        deletedAt: new Date('2025-01-20T14:00:00Z'),
      });

      const result = DocumentPresentationMapper.toResponseDto(deletedDocument);

      expect(result.deleted_at).toBe('2025-01-20T14:00:00.000Z');
    });

    it('should map OCR error when present', () => {
      const documentWithError = new Document({
        id: mockDocument.id,
        userId: mockDocument.userId,
        subscriptionId: mockDocument.subscriptionId,
        contractId: mockDocument.contractId,
        filename: mockDocument.filename,
        r2Key: mockDocument.r2Key,
        r2Bucket: mockDocument.r2Bucket,
        fileHash: mockDocument.fileHash,
        fileSize: mockDocument.fileSize,
        mimeType: mockDocument.mimeType,
        ocrStatus: 'failed',
        ocrError: 'Timeout during OCR processing',
        uploadedAt: mockDocument.uploadedAt,
        updatedAt: mockDocument.updatedAt,
      });

      const result = DocumentPresentationMapper.toResponseDto(documentWithError);

      expect(result.ocr_status).toBe('failed');
      expect(result.ocr_error).toBe('Timeout during OCR processing');
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Documents to array of DocumentResponseDto', () => {
      const document2 = new Document({
        id: 'doc-456',
        userId: 'user-456',
        filename: 'another.pdf',
        r2Key: 'documents/another.pdf',
        r2Bucket: 'bucket',
        fileHash: 'hash456',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
        uploadedAt: new Date('2025-01-16T10:00:00Z'),
        updatedAt: new Date('2025-01-16T10:00:00Z'),
      });

      const documents = [mockDocument, document2];
      const result = DocumentPresentationMapper.toResponseDtoArray(documents);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('doc-123');
      expect(result[1].id).toBe('doc-456');
      expect(result[0].filename).toBe('test-document.pdf');
      expect(result[1].filename).toBe('another.pdf');
    });

    it('should return empty array for empty input', () => {
      const result = DocumentPresentationMapper.toResponseDtoArray([]);

      expect(result).toEqual([]);
    });
  });

  describe('toFilterAppDto', () => {
    it('should map presentation filter to application filter with default values', () => {
      const userId = 'user-123';
      const presentationFilter: DocumentFilterDto = {};

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result).toEqual({
        userId: 'user-123',
        subscriptionId: undefined,
        contractId: undefined,
        ocrStatus: undefined,
        mimeType: undefined,
        limit: 100,
        sort: 'uploaded_at:desc',
      });
    });

    it('should map presentation filter with all fields', () => {
      const userId = 'user-123';
      const presentationFilter: DocumentFilterDto = {
        subscription_id: 'sub-123',
        contract_id: 1,
        ocr_status: 'completed',
        mime_type: 'application/pdf',
        limit: 50,
        sort: 'uploaded_at:asc',
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result).toEqual({
        userId: 'user-123',
        subscriptionId: 'sub-123',
        contractId: 1,
        ocrStatus: 'completed',
        mimeType: 'application/pdf',
        limit: 50,
        sort: 'uploaded_at:asc',
      });
    });

    it('should use default limit when not provided', () => {
      const userId = 'user-789';
      const presentationFilter: DocumentFilterDto = {
        subscription_id: 'sub-456',
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result.limit).toBe(100);
    });

    it('should use default sort when not provided', () => {
      const userId = 'user-789';
      const presentationFilter: DocumentFilterDto = {
        contract_id: 5,
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result.sort).toBe('uploaded_at:desc');
    });

    it('should preserve custom limit value', () => {
      const userId = 'user-123';
      const presentationFilter: DocumentFilterDto = {
        limit: 25,
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result.limit).toBe(25);
    });

    it('should preserve custom sort value', () => {
      const userId = 'user-123';
      const presentationFilter: DocumentFilterDto = {
        sort: 'updated_at:asc',
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result.sort).toBe('updated_at:asc');
    });

    it('should correctly map snake_case to camelCase', () => {
      const userId = 'user-123';
      const presentationFilter: DocumentFilterDto = {
        subscription_id: 'sub-999',
        contract_id: 42,
        ocr_status: 'processing',
        mime_type: 'image/png',
      };

      const result = DocumentPresentationMapper.toFilterAppDto(userId, presentationFilter);

      expect(result.subscriptionId).toBe('sub-999');
      expect(result.contractId).toBe(42);
      expect(result.ocrStatus).toBe('processing');
      expect(result.mimeType).toBe('image/png');
    });
  });

  describe('toReprocessOcrAppDto', () => {
    it('should map reprocess DTO with force flag', () => {
      const presentationDto: ReprocessOcrDto = {
        force: true,
      };

      const result = DocumentPresentationMapper.toReprocessOcrAppDto(presentationDto);

      expect(result).toEqual({
        force: true,
      });
    });

    it('should map reprocess DTO without force flag', () => {
      const presentationDto: ReprocessOcrDto = {
        force: false,
      };

      const result = DocumentPresentationMapper.toReprocessOcrAppDto(presentationDto);

      expect(result).toEqual({
        force: false,
      });
    });

    it('should use default force value when not provided', () => {
      const presentationDto: ReprocessOcrDto = {};

      const result = DocumentPresentationMapper.toReprocessOcrAppDto(presentationDto);

      expect(result).toEqual({
        force: false,
      });
    });

    it('should handle undefined force value', () => {
      const presentationDto: ReprocessOcrDto = {
        force: undefined,
      };

      const result = DocumentPresentationMapper.toReprocessOcrAppDto(presentationDto);

      expect(result.force).toBe(false);
    });
  });
});
