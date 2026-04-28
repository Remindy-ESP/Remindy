import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DocumentController } from './document.controller';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from '../../application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from '../../application/use-cases/reprocess-ocr.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { DOCUMENT_REPOSITORY } from '../../application/ports/document-repository.interface';
import { QuotaService } from '../../application/services/quota.service';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';
import { Document } from '../../domain/document.entity';
import type { Request } from 'express';

describe('DocumentController', () => {
  let controller: DocumentController;
  let uploadDocumentUseCase: jest.Mocked<UploadDocumentUseCase>;
  let findAllDocumentsUseCase: jest.Mocked<FindAllDocumentsUseCase>;
  let deleteDocumentUseCase: jest.Mocked<DeleteDocumentUseCase>;
  let reprocessOcrUseCase: jest.Mocked<ReprocessOcrUseCase>;

  const mockUser = {
    userId: 'user-123',
    role: 'user_freemium',
  };

  const mockRequest = {
    user: mockUser,
  } as Request & { user: { userId: string; role: string } };

  const mockDocument = new Document({
    id: 'doc-123',
    userId: 'user-123',
    subscriptionId: 'sub-123',
    contractId: 1,
    filename: 'test-document.pdf',
    r2Key: 'documents/test-document.pdf',
    r2Bucket: 'remindy-documents',
    fileHash: 'hash123',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    ocrText: 'Extracted text',
    ocrStatus: 'completed',
    uploadedAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  });

  beforeEach(async () => {
    const mockUploadUseCase: Partial<jest.Mocked<UploadDocumentUseCase>> = {
      execute: jest.fn(),
    };

    const mockFindAllUseCase: Partial<jest.Mocked<FindAllDocumentsUseCase>> = {
      execute: jest.fn(),
    };

    const mockDeleteUseCase: Partial<jest.Mocked<DeleteDocumentUseCase>> = {
      execute: jest.fn(),
    };

    const mockReprocessUseCase: Partial<jest.Mocked<ReprocessOcrUseCase>> = {
      execute: jest.fn(),
    };

    const mockUpdateUseCase: Partial<jest.Mocked<UpdateDocumentUseCase>> = {
      execute: jest.fn(),
    };

    const mockR2Service: Partial<jest.Mocked<CloudflareR2Service>> = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockDocumentRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const mockQuotaService: Partial<jest.Mocked<QuotaService>> = {
      checkUserQuota: jest.fn(),
      getUserQuotaUsage: jest.fn(),
      formatBytes: jest.fn(),
    };

    const mockQueueService: Partial<jest.Mocked<InMemoryQueueService>> = {
      addDocumentToQueue: jest.fn(),
      getQueueStats: jest.fn(),
      getJobStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: UploadDocumentUseCase,
          useValue: mockUploadUseCase,
        },
        {
          provide: FindAllDocumentsUseCase,
          useValue: mockFindAllUseCase,
        },
        {
          provide: DeleteDocumentUseCase,
          useValue: mockDeleteUseCase,
        },
        {
          provide: ReprocessOcrUseCase,
          useValue: mockReprocessUseCase,
        },
        {
          provide: UpdateDocumentUseCase,
          useValue: mockUpdateUseCase,
        },
        {
          provide: CloudflareR2Service,
          useValue: mockR2Service,
        },
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockDocumentRepository,
        },
        {
          provide: QuotaService,
          useValue: mockQuotaService,
        },
        {
          provide: InMemoryQueueService,
          useValue: mockQueueService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentController>(DocumentController);
    uploadDocumentUseCase = module.get(UploadDocumentUseCase);
    findAllDocumentsUseCase = module.get(FindAllDocumentsUseCase);
    deleteDocumentUseCase = module.get(DeleteDocumentUseCase);
    reprocessOcrUseCase = module.get(ReprocessOcrUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('mock file content'),
      size: 1024000,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload a document successfully', async () => {
      uploadDocumentUseCase.execute.mockResolvedValue(mockDocument);

      const result = await controller.upload(
        mockRequest,
        mockFile,
        'user-123',
        'sub-123',
        '1',
        'freemium',
      );

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          filename: 'test-document.pdf',
          folderId: 'freemium',
          fileBuffer: mockFile.buffer,
          fileSize: 1024000,
          mimeType: 'application/pdf',
          subscriptionId: 'sub-123',
          contractId: 1,
        },
        'freemium',
      );

      expect(result).toEqual({
        id: 'doc-123',
        user_id: 'user-123',
        subscription_id: 'sub-123',
        contract_id: 1,
        filename: 'test-document.pdf',
        r2_key: 'documents/test-document.pdf',
        r2_bucket: 'remindy-documents',
        file_hash: 'hash123',
        file_size: 1024000,
        mime_type: 'application/pdf',
        ocr_text: 'Extracted text',
        ocr_status: 'completed',
        ocr_error: undefined,
        uploaded_at: '2024-01-01T10:00:00.000Z',
        updated_at: '2024-01-01T10:00:00.000Z',
        deleted_at: undefined,
      });
    });

    it('should upload without subscription and contract IDs', async () => {
      const documentProps = {
        id: mockDocument.id,
        userId: mockDocument.userId,
        filename: mockDocument.filename,
        r2Key: mockDocument.r2Key,
        r2Bucket: mockDocument.r2Bucket,
        fileHash: mockDocument.fileHash,
        fileSize: mockDocument.fileSize,
        mimeType: mockDocument.mimeType,
        ocrStatus: mockDocument.ocrStatus,
        uploadedAt: mockDocument.uploadedAt,
        updatedAt: mockDocument.updatedAt,
      };
      const documentWithoutLinks = new Document(documentProps);
      uploadDocumentUseCase.execute.mockResolvedValue(documentWithoutLinks);

      const result = await controller.upload(mockRequest, mockFile, 'user-123');

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          filename: 'test-document.pdf',
          folderId: undefined,
          fileBuffer: mockFile.buffer,
          fileSize: 1024000,
          mimeType: 'application/pdf',
          subscriptionId: undefined,
          contractId: undefined,
        },
        'freemium',
      );

      expect(result.subscription_id).toBeUndefined();
      expect(result.contract_id).toBeUndefined();
    });

    it('should throw BadRequestException when file is missing', async () => {
      await expect(controller.upload(mockRequest, null as any, 'user-123')).rejects.toThrow(
        BadRequestException,
      );

      await expect(controller.upload(mockRequest, null as any, 'user-123')).rejects.toThrow(
        'File is required',
      );
    });

    it('should parse contractId as integer', async () => {
      uploadDocumentUseCase.execute.mockResolvedValue(mockDocument);

      await controller.upload(mockRequest, mockFile, 'user-123', undefined, '42');

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 42,
        }),
        'freemium',
      );
    });

    it('should handle undefined contractId', async () => {
      uploadDocumentUseCase.execute.mockResolvedValue(mockDocument);

      await controller.upload(mockRequest, mockFile, 'user-123', undefined, undefined);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: undefined,
        }),
        'freemium',
      );
    });
  });

  describe('findAll', () => {
    it('should find all documents with default filters', async () => {
      findAllDocumentsUseCase.execute.mockResolvedValue([mockDocument]);

      const result = await controller.findAll({}, 'user-123');

      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        subscriptionId: undefined,
        contractId: undefined,
        ocrStatus: undefined,
        mimeType: undefined,
        limit: 100,
        sort: 'uploaded_at:desc',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('doc-123');
    });

    it('should apply all filters', async () => {
      findAllDocumentsUseCase.execute.mockResolvedValue([mockDocument]);

      const filters = {
        subscription_id: 'sub-123',
        contract_id: 1,
        ocr_status: 'completed' as const,
        mime_type: 'application/pdf',
        limit: 50,
        sort: 'uploaded_at:asc',
      };

      await controller.findAll(filters, 'user-123');

      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        subscriptionId: 'sub-123',
        contractId: 1,
        ocrStatus: 'completed',
        mimeType: 'application/pdf',
        limit: 50,
        sort: 'uploaded_at:asc',
      });
    });

    it('should return empty array when no documents found', async () => {
      findAllDocumentsUseCase.execute.mockResolvedValue([]);

      const result = await controller.findAll({}, 'user-123');

      expect(result).toEqual([]);
    });

    it('should map multiple documents correctly', async () => {
      const document2 = new Document({
        id: 'doc-456',
        userId: mockDocument.userId,
        subscriptionId: mockDocument.subscriptionId,
        contractId: mockDocument.contractId,
        filename: 'another-document.pdf',
        r2Key: mockDocument.r2Key,
        r2Bucket: mockDocument.r2Bucket,
        fileHash: mockDocument.fileHash,
        fileSize: mockDocument.fileSize,
        mimeType: mockDocument.mimeType,
        ocrStatus: mockDocument.ocrStatus,
        uploadedAt: mockDocument.uploadedAt,
        updatedAt: mockDocument.updatedAt,
      });

      findAllDocumentsUseCase.execute.mockResolvedValue([mockDocument, document2]);

      const result = await controller.findAll({}, 'user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('doc-123');
      expect(result[1].id).toBe('doc-456');
    });
  });

  describe('delete', () => {
    it('should delete a document successfully', async () => {
      deleteDocumentUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('doc-123', 'user-123');

      expect(deleteDocumentUseCase.execute).toHaveBeenCalledWith('doc-123', 'user-123');
    });

    it('should pass correct user ID for authorization', async () => {
      deleteDocumentUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('doc-123', 'different-user-456');

      expect(deleteDocumentUseCase.execute).toHaveBeenCalledWith('doc-123', 'different-user-456');
    });
  });

  describe('reprocessOcr', () => {
    it('should reprocess OCR without force flag', async () => {
      reprocessOcrUseCase.execute.mockResolvedValue(mockDocument);

      const result = await controller.reprocessOcr('doc-123', {}, 'user-123');

      expect(reprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-123', 'user-123', {
        force: false,
      });

      expect(result.id).toBe('doc-123');
    });

    it('should reprocess OCR with force flag', async () => {
      reprocessOcrUseCase.execute.mockResolvedValue(mockDocument);

      const result = await controller.reprocessOcr('doc-123', { force: true }, 'user-123');

      expect(reprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-123', 'user-123', {
        force: true,
      });

      expect(result.id).toBe('doc-123');
    });

    it('should return updated document after reprocessing', async () => {
      const updatedDocument = new Document({
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
        ocrStatus: 'processing',
        uploadedAt: mockDocument.uploadedAt,
        updatedAt: mockDocument.updatedAt,
      });
      reprocessOcrUseCase.execute.mockResolvedValue(updatedDocument);

      const result = await controller.reprocessOcr('doc-123', {}, 'user-123');

      expect(result.ocr_status).toBe('processing');
    });

    it('should pass correct user ID for authorization', async () => {
      reprocessOcrUseCase.execute.mockResolvedValue(mockDocument);

      await controller.reprocessOcr('doc-123', {}, 'different-user-789');

      expect(reprocessOcrUseCase.execute).toHaveBeenCalledWith(
        'doc-123',
        'different-user-789',
        expect.any(Object),
      );
    });
  });
});
