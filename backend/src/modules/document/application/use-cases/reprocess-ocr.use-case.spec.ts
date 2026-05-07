import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReprocessOcrUseCase } from './reprocess-ocr.use-case';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { OcrService } from '../../infrastructure/services/ocr.service';
import { GeminiParserService } from '../../infrastructure/services/gemini-parser.service';
import { Document } from '../../domain/document.entity';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';

describe('ReprocessOcrUseCase', () => {
  let useCase: ReprocessOcrUseCase;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
      updateOcrStatus: jest.fn(),
    };

    const mockR2Service: Partial<jest.Mocked<CloudflareR2Service>> = {
      downloadFile: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
    };

    const mockOcrService: Partial<jest.Mocked<OcrService>> = {
      extractText: jest.fn().mockResolvedValue('Extracted text'),
    };

    const mockGeminiParser: Partial<jest.Mocked<GeminiParserService>> = {
      parseDocument: jest.fn().mockResolvedValue({
        provider: 'Netflix',
        amount: 12.99,
        currency: 'EUR',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReprocessOcrUseCase,
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
        { provide: CloudflareR2Service, useValue: mockR2Service },
        { provide: OcrService, useValue: mockOcrService },
        { provide: GeminiParserService, useValue: mockGeminiParser },
        {
          provide: InMemoryQueueService,
          useValue: {
            add: jest.fn(),
            getJobStatus: jest.fn(),
            addDocumentToQueue: jest.fn().mockResolvedValue({ jobId: 'job-123' }),
          },
        },
      ],
    }).compile();

    useCase = module.get<ReprocessOcrUseCase>(ReprocessOcrUseCase);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  it('should reprocess document successfully', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'users/user-123/documents/invoice.pdf',
      r2Bucket: 'remindy-documents',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.update.mockResolvedValue(mockDocument);

    const result = await useCase.execute(documentId, userId, { force: false });

    expect(result.ocrStatus).toBe('pending');
    expect(repository.findById).toHaveBeenCalledWith(documentId);
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when document not found', async () => {
    const documentId = 'non-existent';
    const userId = 'user-123';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when document does not belong to user', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';
    const otherUserId = 'user-456';

    const mockDocument = new Document({
      id: documentId,
      userId: otherUserId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
    });

    repository.findById.mockResolvedValue(mockDocument);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException when OCR already completed without force', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    repository.findById.mockResolvedValue(mockDocument);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      'OCR already completed. Use force=true to reprocess.',
    );
  });

  it('should throw BadRequestException when OCR already processing', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'processing',
    });

    repository.findById.mockResolvedValue(mockDocument);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      'OCR is already processing for this document',
    );
  });

  it('should throw NotFoundException when update fails', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should reprocess when force=true and OCR is already completed', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'completed',
    });

    // After retryOcr, status becomes 'pending'
    const pendingDoc = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'pending',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.update.mockResolvedValue(pendingDoc);

    const result = await useCase.execute(documentId, userId, { force: true });

    expect(result.ocrStatus).toBe('pending');
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when updated document has no id', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
    });

    // Return a document without an id
    const noIdDoc = new Document({
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'pending',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.update.mockResolvedValue(noIdDoc);

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      'Document ID is missing',
    );
  });

  it('should call updateOcrStatus with failed when queue addition throws', async () => {
    const documentId = 'doc-123';
    const userId = 'user-123';

    const mockDocument = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'failed',
    });

    const pendingDoc = new Document({
      id: documentId,
      userId,
      filename: 'invoice.pdf',
      r2Key: 'key',
      r2Bucket: 'bucket',
      fileHash: 'hash',
      fileSize: 1024,
      mimeType: 'application/pdf',
      ocrStatus: 'pending',
    });

    repository.findById.mockResolvedValue(mockDocument);
    repository.update.mockResolvedValue(pendingDoc);
    repository.updateOcrStatus.mockResolvedValue(undefined);

    // Get the queueService from the module and make it throw
    const module: any = (useCase as any);
    // Access private queueService via bracket notation
    const origQueue = (useCase as any).queueService;
    origQueue.addDocumentToQueue = jest.fn().mockRejectedValue(new Error('queue error'));

    await expect(useCase.execute(documentId, userId, { force: false })).rejects.toThrow(
      'Failed to initiate OCR reprocessing',
    );

    expect(repository.updateOcrStatus).toHaveBeenCalledWith(
      documentId,
      'failed',
      expect.stringContaining('Failed to queue for reprocessing'),
    );
  });
});
