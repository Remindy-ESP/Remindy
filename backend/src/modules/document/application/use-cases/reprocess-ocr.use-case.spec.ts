import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReprocessOcrUseCase } from './reprocess-ocr.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { ReprocessOcrAppDto } from '../dto/reprocess-ocr-app.dto';

describe('ReprocessOcrUseCase', () => {
  let useCase: ReprocessOcrUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReprocessOcrUseCase,
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ReprocessOcrUseCase>(ReprocessOcrUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should reprocess OCR for a failed document', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const dto: ReprocessOcrAppDto = { force: false };

    const existingDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
      ocrError: 'Timeout',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedDocument = new Document({
      id: existingDocument.id,
      userId: existingDocument.userId,
      filename: existingDocument.filename,
      r2Key: existingDocument.r2Key,
      r2Bucket: existingDocument.r2Bucket,
      fileHash: existingDocument.fileHash,
      fileSize: existingDocument.fileSize,
      mimeType: existingDocument.mimeType,
      ocrStatus: 'pending',
      uploadedAt: existingDocument.uploadedAt,
      updatedAt: existingDocument.updatedAt,
    });

    repository.findById.mockResolvedValue(existingDocument);
    repository.update.mockResolvedValue(updatedDocument);

    const result = await useCase.execute(documentId, userId, dto);

    expect(result.ocrStatus).toBe('pending');
    expect(repository.findById).toHaveBeenCalledWith(documentId);
    expect(repository.update).toHaveBeenCalledWith(documentId, expect.any(Document));
  });

  it('should throw BadRequestException when OCR already completed without force', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const dto: ReprocessOcrAppDto = { force: false };

    const existingDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
      ocrText: 'Extracted text',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingDocument);

    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(
      'OCR already completed. Use force=true to reprocess.',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should reprocess OCR when completed with force=true', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const dto: ReprocessOcrAppDto = { force: true };

    const existingDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
      ocrText: 'Old text',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedDocument = new Document({
      id: existingDocument.id,
      userId: existingDocument.userId,
      filename: existingDocument.filename,
      r2Key: existingDocument.r2Key,
      r2Bucket: existingDocument.r2Bucket,
      fileHash: existingDocument.fileHash,
      fileSize: existingDocument.fileSize,
      mimeType: existingDocument.mimeType,
      ocrStatus: 'pending',
      uploadedAt: existingDocument.uploadedAt,
      updatedAt: existingDocument.updatedAt,
    });

    repository.findById.mockResolvedValue(existingDocument);
    repository.update.mockResolvedValue(updatedDocument);

    const result = await useCase.execute(documentId, userId, dto);

    expect(result.ocrStatus).toBe('pending');
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw BadRequestException when OCR is already processing', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const dto: ReprocessOcrAppDto = { force: false };

    const existingDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'processing',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingDocument);

    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(
      'OCR is already processing for this document',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when document does not exist', async () => {
    const documentId = 'non-existent';
    const userId = 'user-123';
    const dto: ReprocessOcrAppDto = { force: false };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when document belongs to different user', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const differentUserId = 'user-456';
    const dto: ReprocessOcrAppDto = { force: false };

    const existingDocument = new Document({
      id: documentId,
      userId: differentUserId,
      filename: 'test.pdf',
      r2Key: 'key',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingDocument);

    await expect(useCase.execute(documentId, userId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
