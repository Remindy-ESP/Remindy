import { Test, TestingModule } from '@nestjs/testing';
import { FindAllDocumentsUseCase } from './find-all-documents.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';

describe('FindAllDocumentsUseCase', () => {
  let useCase: FindAllDocumentsUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllDocumentsUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<FindAllDocumentsUseCase>(FindAllDocumentsUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should return all documents for a user', async () => {
    const filters = { userId: 'user-123' };
    const mockDocuments = [
      new Document({
        id: 'doc-1',
        userId: filters.userId,
        filename: 'invoice1.pdf',
        r2Key: 'key1',
        r2Bucket: 'bucket',
        fileHash: 'hash1',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
      }),
      new Document({
        id: 'doc-2',
        userId: filters.userId,
        filename: 'invoice2.pdf',
        r2Key: 'key2',
        r2Bucket: 'bucket',
        fileHash: 'hash2',
        fileSize: 2048,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
      }),
    ];

    repository.findAll.mockResolvedValue(mockDocuments);

    const result = await useCase.execute(filters);

    expect(result).toEqual(mockDocuments);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });
});
