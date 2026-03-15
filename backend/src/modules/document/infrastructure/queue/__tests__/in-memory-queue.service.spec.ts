import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InMemoryQueueService } from '../in-memory-queue.service';
import { OcrService } from '../../services/ocr.service';
import { GeminiParserService } from '../../services/gemini-parser.service';
import { CloudflareR2Service } from '../../services/cloudflare-r2.service';
import { DOCUMENT_REPOSITORY } from '../../../application/ports/document-repository.interface';
import type { IDocumentRepository } from '../../../application/ports/document-repository.interface';

describe('InMemoryQueueService', () => {
  let service: InMemoryQueueService;
  let mockOcrService: jest.Mocked<OcrService>;
  let mockGeminiParser: jest.Mocked<GeminiParserService>;
  let mockR2Service: jest.Mocked<CloudflareR2Service>;
  let mockRepository: jest.Mocked<IDocumentRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockOcrService = {
      extractText: jest.fn(),
      cleanExtractedText: jest.fn(),
    } as any;

    mockGeminiParser = {
      parseDocument: jest.fn(),
    } as any;

    mockR2Service = {
      downloadFile: jest.fn(),
    } as any;

    mockRepository = {
      updateOcrStatus: jest.fn(),
      updateOcrAndParsedData: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InMemoryQueueService,
        { provide: OcrService, useValue: mockOcrService },
        { provide: GeminiParserService, useValue: mockGeminiParser },
        { provide: CloudflareR2Service, useValue: mockR2Service },
        { provide: DOCUMENT_REPOSITORY, useValue: mockRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<InMemoryQueueService>(InMemoryQueueService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('addDocumentToQueue', () => {
    it('should add a document to the queue and return a job ID', async () => {
      const jobId = await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      expect(jobId).toMatch(/^ocr-job-\d+-\d+$/);
    });

    it('should generate unique job IDs', async () => {
      const jobId1 = await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test1.pdf',
      );

      const jobId2 = await service.addDocumentToQueue(
        'doc-456',
        'user-123',
        'r2-key-456',
        'application/pdf',
        'test2.pdf',
      );

      expect(jobId1).not.toEqual(jobId2);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for an existing job', async () => {
      // Mock all dependencies to prevent actual processing
      mockR2Service.downloadFile.mockResolvedValue(Buffer.from('test'));
      mockOcrService.extractText.mockResolvedValue('');
      mockOcrService.cleanExtractedText.mockReturnValue('');

      const jobId = await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      const jobStatus = await service.getJobStatus(jobId);

      // Le job peut être en waiting ou active selon le timing
      expect(jobStatus).toMatchObject({
        id: jobId,
        status: expect.stringMatching(/waiting|active|failed/),
        attempts: expect.any(Number),
      });
    });

    it('should throw error for non-existent job', async () => {
      await expect(service.getJobStatus('invalid-job-id')).rejects.toThrow(
        'Job invalid-job-id not found',
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      await service.addDocumentToQueue('doc-1', 'user-1', 'key-1', 'application/pdf', 'test1.pdf');
      await service.addDocumentToQueue('doc-2', 'user-1', 'key-2', 'application/pdf', 'test2.pdf');

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: expect.any(Number),
        active: expect.any(Number),
        completed: expect.any(Number),
        failed: expect.any(Number),
        delayed: 0,
      });
    });
  });

  describe('OCR processing', () => {
    it('should process a job successfully', async () => {
      const fileBuffer = Buffer.from('test file content');
      const ocrText = 'Extracted text from document';
      const cleanedText = 'Extracted text from document';
      const parsedData = {
        provider: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        date: new Date('2025-01-01'),
        frequency: 'mensuel' as const,
        category: 'streaming' as const,
        confidence: 0.95,
      };

      mockR2Service.downloadFile.mockResolvedValue(fileBuffer);
      mockOcrService.extractText.mockResolvedValue(ocrText);
      mockOcrService.cleanExtractedText.mockReturnValue(cleanedText);
      mockGeminiParser.parseDocument.mockResolvedValue(parsedData);

      await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      // Attendre que le job soit traité
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRepository.updateOcrStatus).toHaveBeenCalledWith('doc-123', 'processing');
      expect(mockR2Service.downloadFile).toHaveBeenCalledWith('r2-key-123');
      expect(mockOcrService.extractText).toHaveBeenCalledWith(fileBuffer, 'application/pdf');
      expect(mockGeminiParser.parseDocument).toHaveBeenCalledWith(cleanedText);
      expect(mockRepository.updateOcrAndParsedData).toHaveBeenCalledWith('doc-123', {
        ocrText: cleanedText,
        ocrStatus: 'completed',
        parsedProvider: parsedData.provider,
        parsedAmount: parsedData.amount,
        parsedCurrency: parsedData.currency,
        parsedDate: parsedData.date,
        parsedFrequency: parsedData.frequency,
        parsedCategory: parsedData.category,
        parsingConfidence: parsedData.confidence,
      });
    });

    it('should emit events during processing', async () => {
      const fileBuffer = Buffer.from('test file content');
      const ocrText = 'Extracted text';
      const parsedData = {
        provider: 'Test',
        amount: 10.0,
        currency: 'EUR',
        date: new Date(),
        frequency: 'mensuel' as const,
        category: 'autre' as const,
        confidence: 0.9,
      };

      mockR2Service.downloadFile.mockResolvedValue(fileBuffer);
      mockOcrService.extractText.mockResolvedValue(ocrText);
      mockOcrService.cleanExtractedText.mockReturnValue(ocrText);
      mockGeminiParser.parseDocument.mockResolvedValue(parsedData);

      await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      // Attendre le traitement
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ocr.started',
        expect.objectContaining({
          documentId: 'doc-123',
          userId: 'user-123',
          filename: 'test.pdf',
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ocr.completed',
        expect.objectContaining({
          documentId: 'doc-123',
          userId: 'user-123',
          filename: 'test.pdf',
          ocrText,
          parsedData,
        }),
      );
    });

    it('should handle errors and mark job as failed after max attempts', async () => {
      mockR2Service.downloadFile.mockRejectedValue(new Error('Download failed'));

      await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      // Attendre suffisamment longtemps pour toutes les tentatives
      await new Promise(resolve => setTimeout(resolve, 30000));

      expect(mockRepository.updateOcrStatus).toHaveBeenCalledWith(
        'doc-123',
        'failed',
        expect.stringContaining('OCR failed after 3 attempts'),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ocr.failed',
        expect.objectContaining({
          documentId: 'doc-123',
          userId: 'user-123',
          error: 'Download failed',
          attempts: 3,
        }),
      );
    }, 35000);

    it('should retry on failure with exponential backoff', async () => {
      let attemptCount = 0;
      mockR2Service.downloadFile.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve(Buffer.from('success'));
      });

      mockOcrService.extractText.mockResolvedValue('text');
      mockOcrService.cleanExtractedText.mockReturnValue('text');
      mockGeminiParser.parseDocument.mockResolvedValue({
        provider: 'Test',
        amount: 10.0,
        currency: 'EUR',
        date: new Date(),
        frequency: 'mensuel' as const,
        category: 'autre' as const,
        confidence: 0.9,
      });

      await service.addDocumentToQueue(
        'doc-123',
        'user-123',
        'r2-key-123',
        'application/pdf',
        'test.pdf',
      );

      // Attendre les retries
      await new Promise(resolve => setTimeout(resolve, 20000));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ocr.retrying',
        expect.objectContaining({
          documentId: 'doc-123',
          attempt: expect.any(Number),
          maxAttempts: 3,
        }),
      );
    }, 25000);
  });
});
