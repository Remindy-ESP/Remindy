import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { Document } from '../../domain/document.entity';

const DEFAULT_ID = 'doc-123';
const DEFAULT_USER = 'user-123';

function makeDoc(
  overrides: Partial<{ id: string; userId: string; fileSize: number }> = {},
): Document {
  const id = overrides.id ?? DEFAULT_ID;
  const userId = overrides.userId ?? DEFAULT_USER;
  return new Document({
    id,
    userId,
    filename: 'test.pdf',
    r2Key: `users/${userId}/documents/test.pdf`,
    r2Bucket: 'remindy-documents',
    fileHash: 'hash',
    fileSize: overrides.fileSize ?? 1024,
    mimeType: 'application/pdf',
    ocrStatus: 'completed',
  });
}

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;
  let r2Service: jest.Mocked<CloudflareR2Service>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockR2Service: Partial<jest.Mocked<CloudflareR2Service>> = {
      deleteFile: jest.fn(),
    };

    const mockEventEmitter: Partial<jest.Mocked<EventEmitter2>> = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
        { provide: CloudflareR2Service, useValue: mockR2Service },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    useCase = module.get<DeleteDocumentUseCase>(DeleteDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
    r2Service = module.get(CloudflareR2Service);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should delete document successfully', async () => {
    const mockDocument = makeDoc();

    repository.findById.mockResolvedValue(mockDocument);
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockResolvedValue(undefined);

    await useCase.execute(DEFAULT_ID, DEFAULT_USER);

    expect(repository.findById).toHaveBeenCalledWith(DEFAULT_ID);
    expect(r2Service.deleteFile).toHaveBeenCalledWith(mockDocument.r2Key);
    expect(repository.softDelete).toHaveBeenCalledWith(DEFAULT_ID);
  });

  it('should throw NotFoundException when document not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', DEFAULT_USER)).rejects.toThrow(NotFoundException);
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when document belongs to different user', async () => {
    repository.findById.mockResolvedValue(makeDoc({ userId: 'other-user-999' }));

    await expect(useCase.execute(DEFAULT_ID, DEFAULT_USER)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(DEFAULT_ID, DEFAULT_USER)).rejects.toThrow(
      `Document with ID ${DEFAULT_ID} not found`,
    );
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when softDelete returns false', async () => {
    repository.findById.mockResolvedValue(makeDoc());
    repository.softDelete.mockResolvedValue(false);

    await expect(useCase.execute(DEFAULT_ID, DEFAULT_USER)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(DEFAULT_ID, DEFAULT_USER)).rejects.toThrow(
      `Document with ID ${DEFAULT_ID} not found`,
    );
    expect(r2Service.deleteFile).not.toHaveBeenCalled();
  });

  it('should not throw when R2 deletion fails (swallowed error)', async () => {
    repository.findById.mockResolvedValue(makeDoc());
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockRejectedValue(new Error('R2 unavailable'));

    await expect(useCase.execute(DEFAULT_ID, DEFAULT_USER)).resolves.toBeUndefined();
    expect(repository.softDelete).toHaveBeenCalledWith(DEFAULT_ID);
  });

  it('should emit document.deleted event on successful delete', async () => {
    const mockDocument = makeDoc();
    repository.findById.mockResolvedValue(mockDocument);
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockResolvedValue(undefined);

    await useCase.execute(DEFAULT_ID, DEFAULT_USER);

    expect(eventEmitter.emit).toHaveBeenCalledWith('document.deleted', {
      documentId: DEFAULT_ID,
      userId: DEFAULT_USER,
      fileSize: 1024,
      r2Key: mockDocument.r2Key,
      r2Deleted: true,
    });
  });

  it('should emit document.deleted with r2Deleted=false when R2 fails', async () => {
    repository.findById.mockResolvedValue(makeDoc({ fileSize: 2048 }));
    repository.softDelete.mockResolvedValue(true);
    r2Service.deleteFile.mockRejectedValue(new Error('R2 unavailable'));

    await useCase.execute(DEFAULT_ID, DEFAULT_USER);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'document.deleted',
      expect.objectContaining({ r2Deleted: false, fileSize: 2048 }),
    );
  });
});
