import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DocumentRepository } from './document.repository';
import { DocumentEntity } from '../persistence/document.entity';
import { Document } from '../../domain/document.entity';
import { DocumentFilterAppDto } from '../../application/dto/document-filter-app.dto';

describe('DocumentRepository', () => {
  let repository: DocumentRepository;
  let typeOrmRepository: jest.Mocked<Repository<DocumentEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<DocumentEntity>>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentRepository,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<DocumentRepository>(DocumentRepository);
    typeOrmRepository = module.get(getRepositoryToken(DocumentEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save document', async () => {
      const document = new Document({
        userId: 'user-123',
        subscriptionId: 'sub-123',
        contractId: null as any,
        filename: 'test.pdf',
        r2Key: 'documents/test.pdf',
        r2Bucket: 'my-bucket',
        fileHash: 'hash123',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrText: null as any,
        ocrStatus: 'pending',
        ocrError: null as any,
      });

      const savedEntity = Object.assign(new DocumentEntity(), {
        id: 'doc-123',
        userId: document.userId,
        subscriptionId: document.subscriptionId,
        contractId: document.contractId,
        filename: document.filename,
        r2Key: document.r2Key,
        r2Bucket: document.r2Bucket,
        fileHash: document.fileHash,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        ocrText: document.ocrText,
        ocrStatus: document.ocrStatus,
        ocrError: document.ocrError,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.create(document);

      expect(result).toBeInstanceOf(Document);
      expect(result.id).toBe('doc-123');
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find document by id', async () => {
      const documentId = 'doc-123';
      const entity = Object.assign(new DocumentEntity(), {
        id: documentId,
        userId: 'user-123',
        filename: 'test.pdf',
        r2Key: 'documents/test.pdf',
        r2Bucket: 'bucket',
        fileHash: 'hash',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'completed',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findById(documentId);

      expect(result).toBeInstanceOf(Document);
      expect(result?.id).toBe(documentId);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: documentId, deletedAt: null },
      });
    });

    it('should return null when document not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all documents for user', async () => {
      const filters: DocumentFilterAppDto = { userId: 'user-123' };

      const entities = [
        Object.assign(new DocumentEntity(), {
          id: 'doc-1',
          userId: 'user-123',
          filename: 'file1.pdf',
          r2Key: 'documents/file1.pdf',
          r2Bucket: 'bucket',
          fileHash: 'hash1',
          fileSize: 100,
          mimeType: 'application/pdf',
          ocrStatus: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      queryBuilder.getMany.mockResolvedValue(entities);

      const result = await repository.findAll(filters);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Document);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('document.userId = :userId', {
        userId: 'user-123',
      });
    });

    it('should filter by subscriptionId', async () => {
      const filters: DocumentFilterAppDto = {
        userId: 'user-123',
        subscriptionId: 'sub-123',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'document.subscriptionId = :subscriptionId',
        { subscriptionId: 'sub-123' },
      );
    });

    it('should filter by contractId', async () => {
      const filters: DocumentFilterAppDto = {
        userId: 'user-123',
        contractId: 1,
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('document.contractId = :contractId', {
        contractId: 1,
      });
    });

    it('should filter by ocrStatus', async () => {
      const filters: DocumentFilterAppDto = {
        userId: 'user-123',
        ocrStatus: 'completed',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('document.ocrStatus = :ocrStatus', {
        ocrStatus: 'completed',
      });
    });

    it('should apply limit', async () => {
      const filters: DocumentFilterAppDto = {
        userId: 'user-123',
        limit: 50,
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should apply default sorting', async () => {
      const filters: DocumentFilterAppDto = { userId: 'user-123' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('document.uploadedAt', 'DESC');
    });

    it('should apply custom sorting', async () => {
      const filters: DocumentFilterAppDto = {
        userId: 'user-123',
        sort: 'uploaded_at:asc',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('document.uploadedAt', 'ASC');
    });
  });

  describe('update', () => {
    it('should update existing document', async () => {
      const documentId = 'doc-123';
      const document = new Document({
        id: documentId,
        userId: 'user-123',
        subscriptionId: null as any,
        contractId: null as any,
        filename: 'updated.pdf',
        r2Key: 'documents/updated.pdf',
        r2Bucket: 'bucket',
        fileHash: 'hash',
        fileSize: 2048,
        mimeType: 'application/pdf',
        ocrText: 'Updated text',
        ocrStatus: 'completed',
        ocrError: null as any,
      });

      const existingEntity = Object.assign(new DocumentEntity(), {
        id: documentId,
        userId: 'user-123',
      });

      const updatedEntity = Object.assign(new DocumentEntity(), {
        id: documentId,
        userId: document.userId,
        subscriptionId: document.subscriptionId,
        contractId: document.contractId,
        filename: document.filename,
        r2Key: document.r2Key,
        r2Bucket: document.r2Bucket,
        fileHash: document.fileHash,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        ocrText: document.ocrText,
        ocrStatus: document.ocrStatus,
        ocrError: document.ocrError,
        uploadedAt: document.uploadedAt,
        updatedAt: new Date(),
      });

      typeOrmRepository.findOne.mockResolvedValue(existingEntity);
      typeOrmRepository.save.mockResolvedValue(updatedEntity);

      const result = await repository.update(documentId, document);

      expect(result).toBeInstanceOf(Document);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null when document not found', async () => {
      const document = new Document({
        userId: 'user-123',
        filename: 'test.pdf',
        r2Key: 'key',
        r2Bucket: 'bucket',
        fileHash: 'hash',
        fileSize: 100,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
      } as any);

      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', document);

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete document and return true', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('doc-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.delete).toHaveBeenCalledWith('doc-123');
    });

    it('should return false when no document deleted', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete document and return true', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await repository.softDelete('doc-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('doc-123');
    });

    it('should return false when no document soft deleted', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      const result = await repository.softDelete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findByUserId', () => {
    it('should find documents by user ID', async () => {
      const mockEntities = [
        Object.assign(new DocumentEntity(), {
          id: 'doc-1',
          userId: 'user-123',
          filename: 'doc1.pdf',
          r2Key: 'key1',
          r2Bucket: 'bucket',
          fileHash: 'hash1',
          fileSize: 1000,
          mimeType: 'application/pdf',
          ocrStatus: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockFind = jest.fn().mockResolvedValue(mockEntities);
      typeOrmRepository.find = mockFind;

      const result = await repository.findByUserId('user-123');

      expect(result).toHaveLength(1);
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123' }),
        }),
      );
    });
  });

  describe('save', () => {
    it('should save a document and return domain entity', async () => {
      const document = new Document({
        id: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        r2Key: 'key',
        r2Bucket: 'bucket',
        fileHash: 'hash',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
      });

      const savedEntity = Object.assign(new DocumentEntity(), {
        id: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        r2Key: 'key',
        r2Bucket: 'bucket',
        fileHash: 'hash',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'pending',
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.save(document);

      expect(result).toBeInstanceOf(Document);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateOcrStatus', () => {
    it('should update OCR status', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });
      typeOrmRepository.update = mockUpdate;

      await repository.updateOcrStatus('doc-123', 'completed', 'OCR text', undefined);

      expect(mockUpdate).toHaveBeenCalledWith('doc-123', {
        ocrStatus: 'completed',
        ocrText: 'OCR text',
        ocrError: undefined,
      });
    });

    it('should update OCR status with error', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });
      typeOrmRepository.update = mockUpdate;

      await repository.updateOcrStatus('doc-123', 'failed', undefined, 'Some error');

      expect(mockUpdate).toHaveBeenCalledWith('doc-123', {
        ocrStatus: 'failed',
        ocrText: undefined,
        ocrError: 'Some error',
      });
    });
  });

  describe('updateOcrAndParsedData', () => {
    it('should update OCR and parsed data', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });
      typeOrmRepository.update = mockUpdate;

      const data = {
        ocrText: 'Extracted text',
        ocrStatus: 'completed' as const,
        parsedProvider: 'Netflix',
        parsedAmount: 12.99,
        parsedCurrency: 'EUR',
        parsedDate: new Date('2025-01-01'),
        parsedFrequency: 'mensuel',
        parsedCategory: 'streaming',
        parsingConfidence: 0.9,
      };

      await repository.updateOcrAndParsedData('doc-123', data);

      expect(mockUpdate).toHaveBeenCalledWith('doc-123', data);
    });
  });

  describe('findAll - mimeType filter', () => {
    it('should filter by mimeType', async () => {
      const filters = {
        userId: 'user-123',
        mimeType: 'image/png',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('document.mimeType = :mimeType', {
        mimeType: 'image/png',
      });
    });

    it('should use updated_at field when sort field is not uploaded_at', async () => {
      const filters = {
        userId: 'user-123',
        sort: 'updated_at:asc',
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('document.updatedAt', 'ASC');
    });
  });

  describe('findBySubscriptionId', () => {
    it('should find documents by subscription ID excluding soft-deleted', async () => {
      const mockEntities: Partial<DocumentEntity>[] = [
        {
          id: 'doc-1',
          userId: 'user-123',
          subscriptionId: 'sub-123',
          filename: 'doc1.pdf',
          r2Key: 'key1',
          r2Bucket: 'bucket',
          fileHash: 'hash1',
          fileSize: 1000,
          mimeType: 'application/pdf',
          ocrStatus: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null as any,
        },
        {
          id: 'doc-2',
          userId: 'user-123',
          subscriptionId: 'sub-123',
          filename: 'doc2.pdf',
          r2Key: 'key2',
          r2Bucket: 'bucket',
          fileHash: 'hash2',
          fileSize: 2000,
          mimeType: 'application/pdf',
          ocrStatus: 'completed',
          uploadedAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null as any,
        },
      ];

      const mockFind = jest.fn().mockResolvedValue(mockEntities);
      typeOrmRepository.find = mockFind;

      const result = await repository.findBySubscriptionId('sub-123');

      expect(result).toHaveLength(2);
      expect(mockFind).toHaveBeenCalledWith({
        where: {
          subscriptionId: 'sub-123',
          deletedAt: null,
        },
        order: {
          uploadedAt: 'DESC',
        },
      });
    });

    it('should return empty array when no documents found', async () => {
      const mockFind = jest.fn().mockResolvedValue([]);
      typeOrmRepository.find = mockFind;

      const result = await repository.findBySubscriptionId('sub-nonexistent');

      expect(result).toHaveLength(0);
    });
  });
});
