import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateDocumentUseCase } from './update-document.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';

describe('UpdateDocumentUseCase', () => {
  let useCase: UpdateDocumentUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  const makeDocument = (overrides: Partial<any> = {}) =>
    new Document({
      id: 'doc-123',
      userId: 'user-123',
      subscriptionId: 'sub-123',
      contractId: 1,
      folderId: undefined,
      filename: 'original.pdf',
      r2Key: 'users/user-123/documents/original.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash123',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
      ...overrides,
    });

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      findBySubscriptionId: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDocumentUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<UpdateDocumentUseCase>(UpdateDocumentUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('document not found', () => {
    it('should throw NotFoundException when document does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute('doc-999', 'user-123', {})).rejects.toThrow(NotFoundException);
      await expect(useCase.execute('doc-999', 'user-123', {})).rejects.toThrow(
        'Document with ID doc-999 not found',
      );
    });

    it('should throw NotFoundException when document belongs to different user', async () => {
      const doc = makeDocument({ userId: 'other-user' });
      repository.findById.mockResolvedValue(doc);

      await expect(useCase.execute('doc-123', 'user-123', {})).rejects.toThrow(NotFoundException);
      await expect(useCase.execute('doc-123', 'user-123', {})).rejects.toThrow(
        'Document with ID doc-123 not found',
      );
    });
  });

  describe('updating with filename and/or subscriptionId', () => {
    it('should update filename only', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument({ filename: 'new-name.pdf' });

      repository.findById.mockResolvedValue(doc);
      repository.findBySubscriptionId.mockResolvedValue([]);
      repository.update.mockResolvedValue(updatedDoc);

      const result = await useCase.execute('doc-123', 'user-123', { filename: 'new-name.pdf' });

      expect(result.filename).toBe('new-name.pdf');
      expect(repository.update).toHaveBeenCalledWith('doc-123', expect.any(Document));
    });

    it('should update subscriptionId when within 5-doc limit', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument({ subscriptionId: 'sub-456' });

      repository.findById.mockResolvedValue(doc);
      // Only 2 existing active docs (not counting current)
      repository.findBySubscriptionId.mockResolvedValue([
        makeDocument({ id: 'doc-other', subscriptionId: 'sub-456' }),
        makeDocument({ id: 'doc-other2', subscriptionId: 'sub-456' }),
      ]);
      repository.update.mockResolvedValue(updatedDoc);

      const result = await useCase.execute('doc-123', 'user-123', { subscriptionId: 'sub-456' });

      expect(result.subscriptionId).toBe('sub-456');
    });

    it('should throw BadRequestException when subscription already has 5 docs', async () => {
      const doc = makeDocument();
      repository.findById.mockResolvedValue(doc);

      // 5 OTHER active docs linked to that subscription
      const existingDocs = Array(5)
        .fill(null)
        .map((_, i) =>
          makeDocument({
            id: `doc-other-${i}`,
            subscriptionId: 'sub-new',
            deletedAt: undefined,
          }),
        );
      repository.findBySubscriptionId.mockResolvedValue(existingDocs);

      await expect(
        useCase.execute('doc-123', 'user-123', { subscriptionId: 'sub-new' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        useCase.execute('doc-123', 'user-123', { subscriptionId: 'sub-new' }),
      ).rejects.toThrow('Maximum 5 documents par abonnement');
    });

    it('should not count soft-deleted documents toward limit', async () => {
      const doc = makeDocument();
      repository.findById.mockResolvedValue(doc);

      // 5 existing docs, but 1 is soft-deleted
      const existingDocs = [
        makeDocument({ id: 'other-1', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-2', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-3', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-4', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-5', subscriptionId: 'sub-new', deletedAt: new Date() }),
      ];
      repository.findBySubscriptionId.mockResolvedValue(existingDocs);
      repository.update.mockResolvedValue(makeDocument({ subscriptionId: 'sub-new' }));

      // Should NOT throw because only 4 active
      const result = await useCase.execute('doc-123', 'user-123', { subscriptionId: 'sub-new' });
      expect(result).toBeDefined();
    });

    it('should not count the current document toward subscription limit', async () => {
      const doc = makeDocument({ subscriptionId: 'sub-new' });
      repository.findById.mockResolvedValue(doc);

      // The existing docs include the current document plus 4 others = only 4 "other" active
      const existingDocs = [
        makeDocument({ id: 'doc-123', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-1', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-2', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-3', subscriptionId: 'sub-new', deletedAt: undefined }),
        makeDocument({ id: 'other-4', subscriptionId: 'sub-new', deletedAt: undefined }),
      ];
      repository.findBySubscriptionId.mockResolvedValue(existingDocs);
      repository.update.mockResolvedValue(doc);

      // Should NOT throw: after filtering out current doc there are 4, which is < 5
      const result = await useCase.execute('doc-123', 'user-123', { subscriptionId: 'sub-new' });
      expect(result).toBeDefined();
    });

    it('should set subscriptionId to undefined when null is passed', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument({ subscriptionId: undefined });

      repository.findById.mockResolvedValue(doc);
      repository.findBySubscriptionId.mockResolvedValue([]);
      repository.update.mockResolvedValue(updatedDoc);

      // subscriptionId=null means "unlink from subscription"
      const result = await useCase.execute('doc-123', 'user-123', { subscriptionId: null });

      expect(repository.update).toHaveBeenCalledWith('doc-123', expect.any(Document));
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when update returns null', async () => {
      const doc = makeDocument();
      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(null);

      await expect(
        useCase.execute('doc-123', 'user-123', { filename: 'updated.pdf' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.execute('doc-123', 'user-123', { filename: 'updated.pdf' }),
      ).rejects.toThrow('Failed to update document doc-123');
    });

    it('should update folderId alongside filename', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument({ filename: 'new.pdf', folderId: 'folder-1' });

      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(updatedDoc);

      const result = await useCase.execute('doc-123', 'user-123', {
        filename: 'new.pdf',
        folderId: 'folder-1',
      });

      expect(repository.update).toHaveBeenCalled();
      expect(result.folderId).toBe('folder-1');
    });

    it('should update document when only subscriptionId is undefined (preserve existing)', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument();

      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(updatedDoc);

      // filename is provided but subscriptionId is not in dto
      const result = await useCase.execute('doc-123', 'user-123', { filename: 'updated.pdf' });
      expect(result).toBeDefined();
    });
  });

  describe('updating only folderId', () => {
    it('should move document to a folder when only folderId is provided', async () => {
      const doc = makeDocument();
      const updatedDoc = makeDocument({ folderId: 'folder-42' });

      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(updatedDoc);

      const result = await useCase.execute('doc-123', 'user-123', { folderId: 'folder-42' });

      expect(result.folderId).toBe('folder-42');
      expect(repository.update).toHaveBeenCalledWith('doc-123', expect.any(Document));
    });

    it('should move document out of folder when folderId is null', async () => {
      const doc = makeDocument({ folderId: 'folder-42' });
      const updatedDoc = makeDocument({ folderId: undefined });

      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(updatedDoc);

      const result = await useCase.execute('doc-123', 'user-123', { folderId: null as any });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when folder update returns null', async () => {
      const doc = makeDocument();
      repository.findById.mockResolvedValue(doc);
      repository.update.mockResolvedValue(null);

      await expect(
        useCase.execute('doc-123', 'user-123', { folderId: 'folder-42' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('no changes', () => {
    it('should return document unchanged when no dto fields are provided', async () => {
      const doc = makeDocument();
      repository.findById.mockResolvedValue(doc);

      const result = await useCase.execute('doc-123', 'user-123', {});

      expect(result).toBe(doc);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
