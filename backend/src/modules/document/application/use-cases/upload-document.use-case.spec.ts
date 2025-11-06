import { Test, TestingModule } from '@nestjs/testing';
import { UploadDocumentUseCase } from './upload-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UploadDocumentAppDto } from '../dto/upload-document-app.dto';

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadDocumentUseCase,
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UploadDocumentUseCase>(UploadDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
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

    // Vérifier que le document créé a les bonnes propriétés
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
      userId: dto.userId,
      filename: dto.filename,
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
    });

    repository.create.mockResolvedValue(mockDocument);

    await useCase.execute(dto);

    const createdDocument = repository.create.mock.calls[0][0];
    expect(createdDocument.ocrStatus).toBe('pending');
  });

  it('should create document with contract ID when provided', async () => {
    const fileBuffer = Buffer.from('content');
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
    const fileBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
    const dto: UploadDocumentAppDto = {
      userId: 'user-123',
      filename: 'large-file.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Document file size must be between 1 byte and 50MB',
    );
  });
});
