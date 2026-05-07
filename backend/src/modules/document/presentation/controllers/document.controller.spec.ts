import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
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
  let updateDocumentUseCase: jest.Mocked<UpdateDocumentUseCase>;
  let r2Service: jest.Mocked<CloudflareR2Service>;
  let documentRepository: jest.Mocked<any>;
  let quotaService: jest.Mocked<QuotaService>;
  let queueService: jest.Mocked<InMemoryQueueService>;

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
    updateDocumentUseCase = module.get(UpdateDocumentUseCase);
    r2Service = module.get(CloudflareR2Service);
    documentRepository = module.get(DOCUMENT_REPOSITORY);
    quotaService = module.get(QuotaService);
    queueService = module.get(InMemoryQueueService);
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

  describe('findOne', () => {
    it('should return document when found and belongs to user', async () => {
      documentRepository.findById.mockResolvedValue(mockDocument);

      const result = await controller.findOne('doc-123', 'user-123');

      expect(documentRepository.findById).toHaveBeenCalledWith('doc-123');
      expect(result.id).toBe('doc-123');
    });

    it('should throw NotFoundException when document not found', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(controller.findOne('doc-999', 'user-123')).rejects.toThrow(NotFoundException);
      await expect(controller.findOne('doc-999', 'user-123')).rejects.toThrow(
        'Document with ID doc-999 not found',
      );
    });

    it('should throw NotFoundException when document belongs to different user', async () => {
      const otherUserDoc = new Document({
        id: 'doc-123',
        userId: 'other-user',
        filename: 'test.pdf',
        r2Key: 'key',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });
      documentRepository.findById.mockResolvedValue(otherUserDoc);

      await expect(controller.findOne('doc-123', 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update document and return response', async () => {
      const updatedDocument = new Document({
        id: 'doc-123',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        contractId: 1,
        filename: 'updated.pdf',
        r2Key: 'documents/test-document.pdf',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash123',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      });

      updateDocumentUseCase.execute.mockResolvedValue(updatedDocument);

      const result = await controller.update('doc-123', { filename: 'updated.pdf' }, 'user-123');

      expect(updateDocumentUseCase.execute).toHaveBeenCalledWith(
        'doc-123',
        'user-123',
        expect.objectContaining({ filename: 'updated.pdf' }),
      );
      expect(result.filename).toBe('updated.pdf');
    });

    it('should pass folder_id and subscription_id through mapper', async () => {
      updateDocumentUseCase.execute.mockResolvedValue(mockDocument);

      await controller.update(
        'doc-123',
        { filename: 'test.pdf', folder_id: 'folder-1', subscription_id: 'sub-999' },
        'user-123',
      );

      expect(updateDocumentUseCase.execute).toHaveBeenCalledWith('doc-123', 'user-123', {
        filename: 'test.pdf',
        folderId: 'folder-1',
        subscriptionId: 'sub-999',
      });
    });
  });

  describe('downloadDocument', () => {
    it('should download document and return StreamableFile', async () => {
      documentRepository.findById.mockResolvedValue(mockDocument);
      const fileBuffer = Buffer.from('PDF content here');
      r2Service.downloadFile.mockResolvedValue(fileBuffer);

      const result = await controller.downloadDocument('doc-123', 'user-123');

      expect(documentRepository.findById).toHaveBeenCalledWith('doc-123');
      expect(r2Service.downloadFile).toHaveBeenCalledWith('documents/test-document.pdf');
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException when document not found', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(controller.downloadDocument('doc-999', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when document belongs to different user', async () => {
      const otherUserDoc = new Document({
        id: 'doc-123',
        userId: 'other-user',
        filename: 'test.pdf',
        r2Key: 'key',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });
      documentRepository.findById.mockResolvedValue(otherUserDoc);

      await expect(controller.downloadDocument('doc-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
      expect(r2Service.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('getQuota', () => {
    it('should return quota usage with formatted values', async () => {
      const usage = {
        documentsCount: 5,
        maxDocuments: 50,
        storageUsed: 10 * 1024 * 1024,
        maxStorage: 100 * 1024 * 1024,
        storageUsedPercent: 10,
        documentsUsedPercent: 10,
      };
      quotaService.getUserQuotaUsage.mockResolvedValue(usage);
      quotaService.formatBytes.mockReturnValue('10.00 MB');

      const result = await controller.getQuota('user-123', 'freemium');

      expect(result.documentsCount).toBe(5);
      expect(result.storageUsedFormatted).toBe('10.00 MB');
      expect(result.maxStorageFormatted).toBe('10.00 MB');
      expect(quotaService.getUserQuotaUsage).toHaveBeenCalledWith('user-123', 'freemium');
    });

    it('should default to freemium role when no role provided', async () => {
      const usage = {
        documentsCount: 0,
        maxDocuments: 50,
        storageUsed: 0,
        maxStorage: 100 * 1024 * 1024,
        storageUsedPercent: 0,
        documentsUsedPercent: 0,
      };
      quotaService.getUserQuotaUsage.mockResolvedValue(usage);
      quotaService.formatBytes.mockReturnValue('0 B');

      await controller.getQuota('user-123', undefined);

      expect(quotaService.getUserQuotaUsage).toHaveBeenCalledWith('user-123', 'freemium');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = { waiting: 2, active: 1, completed: 10, failed: 0, delayed: 0 };
      queueService.getQueueStats.mockResolvedValue(stats);

      const result = await controller.getQueueStats();

      expect(result).toEqual(stats);
      expect(queueService.getQueueStats).toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for valid job', async () => {
      const jobStatus = {
        id: 'ocr-job-1',
        status: 'completed',
        progress: 100,
        attempts: 1,
        result: { documentId: 'doc-123' },
      };
      queueService.getJobStatus.mockResolvedValue(jobStatus);

      const result = await controller.getJobStatus('ocr-job-1');

      expect(result).toEqual(jobStatus);
      expect(queueService.getJobStatus).toHaveBeenCalledWith('ocr-job-1');
    });

    it('should throw NotFoundException when job not found', async () => {
      queueService.getJobStatus.mockRejectedValue(new Error('Job not found'));

      await expect(controller.getJobStatus('invalid-job')).rejects.toThrow(NotFoundException);
      await expect(controller.getJobStatus('invalid-job')).rejects.toThrow(
        'Job invalid-job not found',
      );
    });
  });

  describe('upload - additional validation', () => {
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

    it('should throw BadRequestException for empty file (0 bytes)', async () => {
      const emptyFile = { ...mockFile, size: 0, buffer: Buffer.alloc(0) };

      await expect(controller.upload(mockRequest, emptyFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.upload(mockRequest, emptyFile, 'user-123')).rejects.toThrow(
        'File is empty (0 bytes)',
      );
    });

    it('should throw BadRequestException for file with empty name', async () => {
      const noNameFile = { ...mockFile, originalname: '   ' };

      await expect(controller.upload(mockRequest, noNameFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.upload(mockRequest, noNameFile, 'user-123')).rejects.toThrow(
        'File must have a valid name',
      );
    });

    it('should throw BadRequestException for unsupported mime type', async () => {
      const invalidTypeFile = { ...mockFile, mimetype: 'application/exe' };

      await expect(controller.upload(mockRequest, invalidTypeFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.upload(mockRequest, invalidTypeFile, 'user-123')).rejects.toThrow(
        'Invalid file type',
      );
    });

    it('should throw BadRequestException when file exceeds 10MB', async () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 };

      await expect(controller.upload(mockRequest, largeFile, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.upload(mockRequest, largeFile, 'user-123')).rejects.toThrow(
        'File size exceeds 10MB limit',
      );
    });

    it('should accept image/jpeg mime type', async () => {
      const jpegFile = {
        ...mockFile,
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      };
      uploadDocumentUseCase.execute.mockResolvedValue(mockDocument);

      const result = await controller.upload(mockRequest, jpegFile, 'user-123');
      expect(result).toBeDefined();
    });
  });
});
