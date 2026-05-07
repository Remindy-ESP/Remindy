import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { Document } from '../../domain/document.entity';

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;
  let r2Service: jest.Mocked<CloudflareR2Service>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockR2Service: Partial<jest.Mocked<CloudflareR2Service>> = {
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
        { provide: CloudflareR2Service, useValue: mockR2Service },
      ],
    }).compile();

    useCase = module.get<DeleteDocumentUseCase>(DeleteDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
    r2Service = module.get(CloudflareR2Service);
  });

  it('should delete document successfully', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'users/user-123/documents/test.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockResolvedValue(undefined);

    await useCase.execute(documentId, userId);

    expect(repository.findById).toHaveBeenCalledWith(documentId);
    expect(r2Service.deleteFile).toHaveBeenCalledWith(mockDocument.r2Key);
    expect(repository.softDelete).toHaveBeenCalledWith(documentId);
  });

  it('should throw NotFoundException when document not found', async () => {
    const documentId = 'non-existent';
    const userId = 'user-123';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when document belongs to different user', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId: 'other-user-999',
      filename: 'test.pdf',
      r2Key: 'users/other-user/documents/test.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    repository.findById.mockResolvedValue(mockDocument);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(documentId, userId)).rejects.toThrow(
      `Document with ID ${documentId} not found`,
    );
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when softDelete returns false', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'users/user-123/documents/test.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.softDelete.mockResolvedValue(false);

    await expect(useCase.execute(documentId, userId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(documentId, userId)).rejects.toThrow(
      `Document with ID ${documentId} not found`,
    );
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should not throw when R2 deletion fails (swallowed error)', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'test.pdf',
      r2Key: 'users/user-123/documents/test.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockRejectedValue(new Error('R2 unavailable'));

    // Should NOT throw - R2 errors are swallowed
    await expect(useCase.execute(documentId, userId)).resolves.toBeUndefined();
    expect(repository.softDelete).toHaveBeenCalledWith(documentId);
  });
});
