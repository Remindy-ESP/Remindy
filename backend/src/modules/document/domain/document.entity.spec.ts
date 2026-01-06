import { Document } from './document.entity';

describe('Document Entity', () => {
  const validDocumentProps = {
    userId: 'user-123',
    subscriptionId: 'sub-123',
    contractId: 1,
    filename: 'test-document.pdf',
    r2Key: 'documents/test-document.pdf',
    r2Bucket: 'remindy-documents',
    fileHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    ocrStatus: 'pending' as const,
  };

  describe('constructor', () => {
    it('should create a valid document', () => {
      const document = new Document(validDocumentProps);

      expect(document.userId).toBe(validDocumentProps.userId);
      expect(document.filename).toBe(validDocumentProps.filename);
      expect(document.r2Key).toBe(validDocumentProps.r2Key);
      expect(document.r2Bucket).toBe(validDocumentProps.r2Bucket);
      expect(document.fileHash).toBe(validDocumentProps.fileHash);
      expect(document.fileSize).toBe(validDocumentProps.fileSize);
      expect(document.mimeType).toBe(validDocumentProps.mimeType);
      expect(document.ocrStatus).toBe('pending');
    });

    it('should trim whitespace from string fields', () => {
      const propsWithWhitespace = {
        ...validDocumentProps,
        filename: '  test.pdf  ',
        r2Key: '  documents/test.pdf  ',
        r2Bucket: '  bucket  ',
        fileHash: '  hash123  ',
        mimeType: '  application/pdf  ',
      };

      const document = new Document(propsWithWhitespace);

      expect(document.filename).toBe('test.pdf');
      expect(document.r2Key).toBe('documents/test.pdf');
      expect(document.r2Bucket).toBe('bucket');
      expect(document.fileHash).toBe('hash123');
      expect(document.mimeType).toBe('application/pdf');
    });

    it('should accept optional fields', () => {
      const propsWithOptionals = {
        ...validDocumentProps,
        id: 'doc-123',
        ocrText: 'Extracted text content',
        ocrError: 'Some error',
        uploadedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        deletedAt: new Date('2024-01-20'),
      };

      const document = new Document(propsWithOptionals);

      expect(document.id).toBe('doc-123');
      expect(document.ocrText).toBe('Extracted text content');
      expect(document.ocrError).toBe('Some error');
      expect(document.uploadedAt).toEqual(new Date('2024-01-01'));
      expect(document.updatedAt).toEqual(new Date('2024-01-15'));
      expect(document.deletedAt).toEqual(new Date('2024-01-20'));
    });

    it('should throw error if filename is empty', () => {
      const invalidProps = {
        ...validDocumentProps,
        filename: '',
      };

      expect(() => new Document(invalidProps)).toThrow('Document filename cannot be empty');
    });

    it('should throw error if filename exceeds 255 characters', () => {
      const invalidProps = {
        ...validDocumentProps,
        filename: 'a'.repeat(256),
      };

      expect(() => new Document(invalidProps)).toThrow(
        'Document filename cannot exceed 255 characters',
      );
    });

    it('should throw error if r2Key is empty', () => {
      const invalidProps = {
        ...validDocumentProps,
        r2Key: '',
      };

      expect(() => new Document(invalidProps)).toThrow('Document R2 key cannot be empty');
    });

    it('should throw error if fileSize is zero', () => {
      const invalidProps = {
        ...validDocumentProps,
        fileSize: 0,
      };

      expect(() => new Document(invalidProps)).toThrow(
        'Document file size must be between 1 byte and 50MB (52428800 bytes)',
      );
    });

    it('should throw error if fileSize is negative', () => {
      const invalidProps = {
        ...validDocumentProps,
        fileSize: -100,
      };

      expect(() => new Document(invalidProps)).toThrow(
        'Document file size must be between 1 byte and 50MB (52428800 bytes)',
      );
    });

    it('should throw error if fileSize exceeds 50MB', () => {
      const invalidProps = {
        ...validDocumentProps,
        fileSize: 52428801, // 50MB + 1 byte
      };

      expect(() => new Document(invalidProps)).toThrow(
        'Document file size must be between 1 byte and 50MB (52428800 bytes)',
      );
    });

    it('should accept fileSize at maximum allowed (50MB)', () => {
      const propsWithMaxSize = {
        ...validDocumentProps,
        fileSize: 52428800, // Exactly 50MB
      };

      const document = new Document(propsWithMaxSize);
      expect(document.fileSize).toBe(52428800);
    });

    it('should throw error for invalid OCR status', () => {
      const invalidProps = {
        ...validDocumentProps,
        ocrStatus: 'invalid-status' as any,
      };

      expect(() => new Document(invalidProps)).toThrow('Invalid OCR status');
    });
  });

  describe('updateOcrStatus', () => {
    it('should update OCR status to valid value', () => {
      const document = new Document(validDocumentProps);

      document.updateOcrStatus('processing');
      expect(document.ocrStatus).toBe('processing');

      document.updateOcrStatus('completed');
      expect(document.ocrStatus).toBe('completed');

      document.updateOcrStatus('failed');
      expect(document.ocrStatus).toBe('failed');
    });

    it('should throw error for invalid OCR status', () => {
      const document = new Document(validDocumentProps);

      expect(() => document.updateOcrStatus('invalid' as any)).toThrow('Invalid OCR status');
    });
  });

  describe('updateOcrText', () => {
    it('should update OCR text and set status to completed', () => {
      const document = new Document(validDocumentProps);

      document.updateOcrText('This is extracted text from the document');

      expect(document.ocrText).toBe('This is extracted text from the document');
      expect(document.ocrStatus).toBe('completed');
      expect(document.ocrError).toBeUndefined();
    });

    it('should trim whitespace from OCR text', () => {
      const document = new Document(validDocumentProps);

      document.updateOcrText('  extracted text  ');

      expect(document.ocrText).toBe('extracted text');
    });

    it('should clear OCR error when updating text', () => {
      const propsWithError = {
        ...validDocumentProps,
        ocrStatus: 'failed' as const,
        ocrError: 'Previous error',
      };
      const document = new Document(propsWithError);

      document.updateOcrText('New extracted text');

      expect(document.ocrError).toBeUndefined();
      expect(document.ocrStatus).toBe('completed');
    });
  });

  describe('setOcrError', () => {
    it('should set OCR error and update status to failed', () => {
      const document = new Document(validDocumentProps);

      document.setOcrError('OCR processing timeout');

      expect(document.ocrError).toBe('OCR processing timeout');
      expect(document.ocrStatus).toBe('failed');
    });

    it('should trim whitespace from error message', () => {
      const document = new Document(validDocumentProps);

      document.setOcrError('  error message  ');

      expect(document.ocrError).toBe('error message');
    });
  });

  describe('startOcrProcessing', () => {
    it('should set status to processing and clear error', () => {
      const propsWithError = {
        ...validDocumentProps,
        ocrStatus: 'failed' as const,
        ocrError: 'Previous error',
      };
      const document = new Document(propsWithError);

      document.startOcrProcessing();

      expect(document.ocrStatus).toBe('processing');
      expect(document.ocrError).toBeUndefined();
    });
  });

  describe('retryOcr', () => {
    it('should reset OCR status to pending and clear error and text', () => {
      const propsWithOcrData = {
        ...validDocumentProps,
        ocrStatus: 'failed' as const,
        ocrError: 'Processing failed',
        ocrText: 'Partial text',
      };
      const document = new Document(propsWithOcrData);

      document.retryOcr();

      expect(document.ocrStatus).toBe('pending');
      expect(document.ocrError).toBeUndefined();
      expect(document.ocrText).toBeUndefined();
    });
  });

  describe('linkToSubscription', () => {
    it('should link document to subscription', () => {
      const document = new Document(validDocumentProps);

      document.linkToSubscription('new-sub-456');

      expect(document.subscriptionId).toBe('new-sub-456');
    });
  });

  describe('linkToContract', () => {
    it('should link document to contract', () => {
      const document = new Document(validDocumentProps);

      document.linkToContract(42);

      expect(document.contractId).toBe(42);
    });
  });

  describe('isPdf', () => {
    it('should return true for PDF documents', () => {
      const pdfDocument = new Document({
        ...validDocumentProps,
        mimeType: 'application/pdf',
      });

      expect(pdfDocument.isPdf()).toBe(true);
    });

    it('should return false for non-PDF documents', () => {
      const imageDocument = new Document({
        ...validDocumentProps,
        mimeType: 'image/png',
      });

      expect(imageDocument.isPdf()).toBe(false);
    });
  });

  describe('isImage', () => {
    it('should return true for image documents', () => {
      const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

      imageTypes.forEach((mimeType) => {
        const document = new Document({
          ...validDocumentProps,
          mimeType,
        });

        expect(document.isImage()).toBe(true);
      });
    });

    it('should return false for non-image documents', () => {
      const pdfDocument = new Document({
        ...validDocumentProps,
        mimeType: 'application/pdf',
      });

      expect(pdfDocument.isImage()).toBe(false);
    });
  });
});
