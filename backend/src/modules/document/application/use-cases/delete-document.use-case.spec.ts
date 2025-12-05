import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDocumentUseCase,
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteDocumentUseCase>(DeleteDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete a document successfully', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

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
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingDocument);
    repository.softDelete.mockResolvedValue(true);

    await useCase.execute(documentId, userId);

    expect(repository.findById).toHaveBeenCalledWith(documentId);
    expect(repository.softDelete).toHaveBeenCalledWith(documentId);
    expect(repository.softDelete).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when document does not exist', async () => {
    const documentId = 'non-existent-doc';
    const userId = 'user-123';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(documentId, userId)).rejects.toThrow(
      `Document with ID ${documentId} not found`,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when document belongs to different user', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const differentUserId = 'user-456';

    const existingDocument = new Document({
      id: documentId,
      userId: differentUserId,
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

    repository.findById.mockResolvedValue(existingDocument);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(documentId, userId)).rejects.toThrow(
      `Document with ID ${documentId} not found`,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when soft delete fails', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

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
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingDocument);
    repository.softDelete.mockResolvedValue(false);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(documentId);
    expect(repository.softDelete).toHaveBeenCalledWith(documentId);
  });
});
