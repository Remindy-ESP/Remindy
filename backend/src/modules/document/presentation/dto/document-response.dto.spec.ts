import { DocumentResponseDto } from './document-response.dto';

describe('DocumentResponseDto', () => {
  it('should create a valid response DTO with all fields', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      subscription_id: '123e4567-e89b-12d3-a456-426614174002',
      contract_id: 1,
      filename: 'test-document.pdf',
      r2_key: 'documents/user/test-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      file_size: 2048576,
      mime_type: 'application/pdf',
      ocr_text: 'Extracted text from the document',
      ocr_status: 'completed',
      ocr_error: undefined,
      uploaded_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:35:00Z',
      deleted_at: undefined,
    };

    expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(dto.user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(dto.subscription_id).toBe('123e4567-e89b-12d3-a456-426614174002');
    expect(dto.contract_id).toBe(1);
    expect(dto.filename).toBe('test-document.pdf');
    expect(dto.r2_key).toBe('documents/user/test-document.pdf');
    expect(dto.r2_bucket).toBe('remindy-documents');
    expect(dto.file_hash).toBe('a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');
    expect(dto.file_size).toBe(2048576);
    expect(dto.mime_type).toBe('application/pdf');
    expect(dto.ocr_text).toBe('Extracted text from the document');
    expect(dto.ocr_status).toBe('completed');
    expect(dto.uploaded_at).toBe('2025-01-15T10:30:00Z');
    expect(dto.updated_at).toBe('2025-01-15T10:35:00Z');
  });

  it('should create response DTO with minimal required fields', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      filename: 'minimal-document.pdf',
      r2_key: 'documents/minimal-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash123',
      file_size: 1024,
      mime_type: 'application/pdf',
      ocr_status: 'pending',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    };

    expect(dto.id).toBeDefined();
    expect(dto.user_id).toBeDefined();
    expect(dto.filename).toBeDefined();
    expect(dto.subscription_id).toBeUndefined();
    expect(dto.contract_id).toBeUndefined();
    expect(dto.ocr_text).toBeUndefined();
    expect(dto.ocr_error).toBeUndefined();
    expect(dto.deleted_at).toBeUndefined();
  });

  it('should handle OCR status values', () => {
    const statuses = ['pending', 'processing', 'completed', 'failed'];

    statuses.forEach((status) => {
      const dto: DocumentResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        filename: 'test.pdf',
        r2_key: 'documents/test.pdf',
        r2_bucket: 'bucket',
        file_hash: 'hash',
        file_size: 1024,
        mime_type: 'application/pdf',
        ocr_status: status,
        uploaded_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      expect(dto.ocr_status).toBe(status);
    });
  });

  it('should include OCR error when OCR failed', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      filename: 'failed-ocr.pdf',
      r2_key: 'documents/failed-ocr.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash456',
      file_size: 2048,
      mime_type: 'application/pdf',
      ocr_status: 'failed',
      ocr_error: 'Timeout during OCR processing',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:05:00Z',
    };

    expect(dto.ocr_status).toBe('failed');
    expect(dto.ocr_error).toBe('Timeout during OCR processing');
  });

  it('should handle different MIME types', () => {
    const mimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
    ];

    mimeTypes.forEach((mimeType) => {
      const dto: DocumentResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        filename: 'test-file',
        r2_key: 'documents/test-file',
        r2_bucket: 'bucket',
        file_hash: 'hash',
        file_size: 1024,
        mime_type: mimeType,
        ocr_status: 'completed',
        uploaded_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      expect(dto.mime_type).toBe(mimeType);
    });
  });

  it('should include deleted_at when document is soft deleted', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      filename: 'deleted-document.pdf',
      r2_key: 'documents/deleted-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash789',
      file_size: 4096,
      mime_type: 'application/pdf',
      ocr_status: 'completed',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:30:00Z',
      deleted_at: '2025-01-20T14:00:00Z',
    };

    expect(dto.deleted_at).toBe('2025-01-20T14:00:00Z');
  });

  it('should handle various file sizes', () => {
    const fileSizes = [
      1024, // 1 KB
      1048576, // 1 MB
      10485760, // 10 MB
      52428800, // 50 MB
    ];

    fileSizes.forEach((fileSize) => {
      const dto: DocumentResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        filename: 'test.pdf',
        r2_key: 'documents/test.pdf',
        r2_bucket: 'bucket',
        file_hash: 'hash',
        file_size: fileSize,
        mime_type: 'application/pdf',
        ocr_status: 'pending',
        uploaded_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      expect(dto.file_size).toBe(fileSize);
    });
  });

  it('should handle documents linked to subscriptions', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      subscription_id: '123e4567-e89b-12d3-a456-426614174002',
      filename: 'subscription-document.pdf',
      r2_key: 'documents/subscription-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash',
      file_size: 2048,
      mime_type: 'application/pdf',
      ocr_status: 'completed',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    };

    expect(dto.subscription_id).toBe('123e4567-e89b-12d3-a456-426614174002');
    expect(dto.contract_id).toBeUndefined();
  });

  it('should handle documents linked to contracts', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      contract_id: 42,
      filename: 'contract-document.pdf',
      r2_key: 'documents/contract-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash',
      file_size: 2048,
      mime_type: 'application/pdf',
      ocr_status: 'completed',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    };

    expect(dto.contract_id).toBe(42);
    expect(dto.subscription_id).toBeUndefined();
  });

  it('should handle documents linked to both subscription and contract', () => {
    const dto: DocumentResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      subscription_id: '123e4567-e89b-12d3-a456-426614174002',
      contract_id: 1,
      filename: 'linked-document.pdf',
      r2_key: 'documents/linked-document.pdf',
      r2_bucket: 'remindy-documents',
      file_hash: 'hash',
      file_size: 2048,
      mime_type: 'application/pdf',
      ocr_status: 'completed',
      uploaded_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    };

    expect(dto.subscription_id).toBe('123e4567-e89b-12d3-a456-426614174002');
    expect(dto.contract_id).toBe(1);
  });
});
