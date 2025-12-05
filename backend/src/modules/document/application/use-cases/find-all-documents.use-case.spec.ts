import { Test, TestingModule } from '@nestjs/testing';
import { FindAllDocumentsUseCase } from './find-all-documents.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { DocumentFilterAppDto } from '../dto/document-filter-app.dto';

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
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllDocumentsUseCase>(FindAllDocumentsUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all documents for a user', async () => {
    const filters: DocumentFilterAppDto = {
      userId: 'user-123',
      limit: 100,
      sort: 'uploaded_at:desc',
    };

    const expectedDocuments = [
      new Document({
        id: 'doc-1',
        userId: 'user-123',
        filename: 'doc1.pdf',
        r2Key: 'key1',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash1',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }),
      new Document({
        id: 'doc-2',
        userId: 'user-123',
        filename: 'doc2.pdf',
        r2Key: 'key2',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash2',
        fileSize: 2048,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedDocuments);

    const result = await useCase.execute(filters);

    expect(result).toBe(expectedDocuments);
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should filter documents by subscription ID', async () => {
    const filters: DocumentFilterAppDto = {
      userId: 'user-123',
      subscriptionId: 'sub-123',
    };

    const expectedDocuments = [
      new Document({
        id: 'doc-1',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        filename: 'invoice.pdf',
        r2Key: 'key1',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash1',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedDocuments);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].subscriptionId).toBe('sub-123');
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should filter documents by OCR status', async () => {
    const filters: DocumentFilterAppDto = {
      userId: 'user-123',
      ocrStatus: 'failed',
    };

    const expectedDocuments = [
      new Document({
        id: 'doc-1',
        userId: 'user-123',
        filename: 'failed.pdf',
        r2Key: 'key1',
        r2Bucket: 'remindy-documents',
        fileHash: 'hash1',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'failed',
        ocrError: 'Timeout',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedDocuments);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(result[0].ocrStatus).toBe('failed');
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty array when no documents found', async () => {
    const filters: DocumentFilterAppDto = {
      userId: 'user-999',
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(filters);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(filters);
  });
});
