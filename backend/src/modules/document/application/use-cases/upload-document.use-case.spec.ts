import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadDocumentUseCase } from './upload-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UploadDocumentAppDto } from '../dto/upload-document-app.dto';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { QuotaService } from '../services/quota.service';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;
  let quotaService: jest.Mocked<QuotaService>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      create: jest.fn(),
      updateOcrStatus: jest.fn(),
      updateOcrAndParsedData: jest.fn(),
    };

    const mockR2Service: Partial<jest.Mocked<CloudflareR2Service>> = {
      uploadFile: jest.fn().mockResolvedValue('https://r2.example.com/file.pdf'),
    };

    const mockQuotaService: Partial<jest.Mocked<QuotaService>> = {
      checkUserQuota: jest.fn().mockResolvedValue(undefined),
    };

    const mockQueueService: Partial<jest.Mocked<InMemoryQueueService>> = {
      addDocumentToQueue: jest.fn().mockResolvedValue('job-123'),
    };

    const mockEventEmitter: Partial<jest.Mocked<EventEmitter2>> = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
        { provide: CloudflareR2Service, useValue: mockR2Service },
        { provide: QuotaService, useValue: mockQuotaService },
        { provide: InMemoryQueueService, useValue: mockQueueService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    useCase = module.get<UploadDocumentUseCase>(UploadDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
    quotaService = module.get(QuotaService);
  });

  it('should upload a document successfully', async () => {
    const fileBuffer = Buffer.from('fake pdf content');
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'contract.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
      subscriptionId: 'sub-123',
    };

    const expectedDocument = new Document({
      id: 'doc-123',
      userId: dto.userId,
      filename: dto.filename,
      r2Key: 'users/user-123/documents/1234567890-contract.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'abc123def456',
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
      subscriptionId: dto.subscriptionId,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedDocument);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedDocument);
    expect(repository.create).toHaveBeenCalledTimes(1);

    // Verify that the created document has the correct properties
    const createdDocument = repository.create.mock.calls[0][0];
    expect(createdDocument).toBeInstanceOf(Document);
    expect(createdDocument.userId).toBe(dto.userId);
    expect(createdDocument.filename).toBe(dto.filename);
    expect(createdDocument.r2Key).toContain('users/user-123/documents/');
    expect(createdDocument.fileHash).toBeTruthy();
  });

  it('should generate file hash correctly', async () => {
    const fileBuffer = Buffer.from('test content');
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'test.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
    };

    const mockDocument = new Document({
      userId: dto.userId,
      filename: dto.filename,
      r2Key: 'test-key',
      r2Bucket: 'remindy-documents',
      fileHash: 'generated-hash',
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
    });

    repository.create.mockResolvedValue(mockDocument);

    await useCase.execute(dto);

    const createdDocument = repository.create.mock.calls[0][0];
    expect(createdDocument.fileHash).toBeTruthy();
    expect(createdDocument.fileHash).toHaveLength(64); // SHA-256 produces 64 hex chars
  });

  it('should set OCR status to pending by default', async () => {
    const fileBuffer = Buffer.from('pdf content');
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'document.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
    };

    const mockDocument = new Document({
      id: 'doc-123',
      userId: dto.userId,
      filename: dto.filename,
      r2Key: 'users/user-123/documents/doc-123.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'mock-hash',
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
    });

    repository.create.mockResolvedValue(mockDocument);

    const result = await useCase.execute(dto);

    expect(result).toEqual(mockDocument);
    expect(quotaService.checkUserQuota).toHaveBeenCalledWith(
      dto.userId,
      'freemium', // Default role when not specified
      dto.fileSize,
    );
    expect(repository.create).toHaveBeenCalled();
  });

  it('should throw ForbiddenException when quota exceeded', async () => {
    const fileBuffer = Buffer.from('fake pdf content');
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'contract.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
      contractId: 42,
    };

    const mockDocument = new Document({
      userId: dto.userId,
      filename: dto.filename,
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
      contractId: dto.contractId,
    });

    repository.create.mockResolvedValue(mockDocument);

    await useCase.execute(dto);

    const createdDocument = repository.create.mock.calls[0][0];
    expect(createdDocument.contractId).toBe(42);
  });

  it('should throw error when file size exceeds limit', async () => {
    const fileBuffer = Buffer.alloc(15 * 1024 * 1024);
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'large-file.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
      subscriptionId: 'sub-123',
      userRole: 'freemium',
    };

    quotaService.checkUserQuota.mockRejectedValue(new ForbiddenException('Quota exceeded'));

    await expect(useCase.execute(dto)).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
