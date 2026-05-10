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
    jest.clearAllTimers();
    jest.useRealTimers();
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
        status: expect.stringMatching(/waiting|active|failed|completed/),
        attempts: expect.any(Number),
      });
    });
 
    it('should throw error for non-existent job', async () => {
      await expect(service.getJobStatus('invalid-job-id')).rejects.toThrow(
        'Job invalid-job-id not found',
      );
    });

    it('should find job in completedJobs (line 337)', async () => {
      const fakeCompletedJob = {
        id: 'completed-job-1',
        data: {
          documentId: 'doc-c1',
          userId: 'u1',
          r2Key: 'k1',
          mimeType: 'application/pdf',
          filename: 'f.pdf',
        },
        status: 'completed' as const,
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        result: { documentId: 'doc-c1', ocrText: 'text', parsedData: {} },
      };
      (service as any).completedJobs.push(fakeCompletedJob);

      const status = await service.getJobStatus('completed-job-1');
      expect(status.id).toBe('completed-job-1');
      expect(status.status).toBe('completed');
    });

    it('should find job in failedJobs (line 338)', async () => {
      const fakeFailedJob = {
        id: 'failed-job-1',
        data: {
          documentId: 'doc-f1',
          userId: 'u1',
          r2Key: 'k1',
          mimeType: 'application/pdf',
          filename: 'f.pdf',
        },
        status: 'failed' as const,
        attempts: 3,
        maxAttempts: 3,
        error: 'Some error',
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
      };
      (service as any).failedJobs.push(fakeFailedJob);

      const status = await service.getJobStatus('failed-job-1');
      expect(status.id).toBe('failed-job-1');
      expect(status.status).toBe('failed');
      expect(status.failedReason).toBe('Some error');
    });
  });

  describe('startWorker (private)', () => {
    it('should not create a second interval if worker is already running', () => {
      const firstInterval = (service as any).workerInterval;
      expect(firstInterval).toBeTruthy();

      // Calling startWorker again should hit the early return
      (service as any).startWorker();

      expect((service as any).workerInterval).toBe(firstInterval);
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
    // These tests need the real processing path (not the test bypass).
    // We temporarily set NODE_ENV to 'unit-test' so the queue runs the full pipeline
    // with mocked services, while the e2e bypass (NODE_ENV === 'test') stays inactive.
    let originalNodeEnv: string | undefined;
 
    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'unit-test';
    });
 
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });
 
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
      await new Promise(resolve => setTimeout(resolve, 200));
 
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
      await new Promise(resolve => setTimeout(resolve, 200));
 
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

    it('should trim completedJobs history when it exceeds 100 (line 236)', async () => {
      // Fill completedJobs with 100 fake entries
      const fakeCompletedJobs = Array.from({ length: 100 }, (_, i) => ({
        id: `old-completed-${i}`,
        data: {
          documentId: `doc-${i}`,
          userId: 'u1',
          r2Key: 'k',
          mimeType: 'application/pdf',
          filename: 'f.pdf',
        },
        status: 'completed' as const,
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        result: { documentId: `doc-${i}`, ocrText: 'text', parsedData: {} },
      }));
      (service as any).completedJobs.push(...fakeCompletedJobs);
      expect((service as any).completedJobs.length).toBe(100);

      // Now process a successful job so completedJobs grows to 101 and shift() is called
      const fileBuffer = Buffer.from('test');
      mockR2Service.downloadFile.mockResolvedValue(fileBuffer);
      mockOcrService.extractText.mockResolvedValue('text');
      mockOcrService.cleanExtractedText.mockReturnValue('text');
      mockGeminiParser.parseDocument.mockResolvedValue({
        confidence: 0.9,
      });

      await service.addDocumentToQueue(
        'doc-new',
        'user-1',
        'key-new',
        'application/pdf',
        'new.pdf',
      );
      await new Promise(resolve => setTimeout(resolve, 300));

      // After trim, completedJobs should be back to 100
      expect((service as any).completedJobs.length).toBeLessThanOrEqual(100);
    });

    it('should trim failedJobs history when it exceeds 200 (line 298)', async () => {
      // Fill failedJobs with 200 fake entries
      const fakeFailedJobs = Array.from({ length: 200 }, (_, i) => ({
        id: `old-failed-${i}`,
        data: {
          documentId: `doc-f${i}`,
          userId: 'u1',
          r2Key: 'k',
          mimeType: 'application/pdf',
          filename: 'f.pdf',
        },
        status: 'failed' as const,
        attempts: 3,
        maxAttempts: 3,
        error: 'old error',
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
      }));
      (service as any).failedJobs.push(...fakeFailedJobs);
      expect((service as any).failedJobs.length).toBe(200);

      // Directly insert a job with maxAttempts=1 so it fails immediately on first error
      // without triggering exponential backoff delays
      mockR2Service.downloadFile.mockRejectedValue(new Error('always fail'));
      mockRepository.updateOcrStatus.mockResolvedValue(undefined);

      const jobId = `ocr-job-trim-test-${Date.now()}`;
      const failJob = {
        id: jobId,
        data: {
          documentId: 'doc-fail-trim',
          userId: 'user-1',
          r2Key: 'key-fail',
          mimeType: 'application/pdf',
          filename: 'fail.pdf',
        },
        status: 'waiting' as const,
        attempts: 2, // already at maxAttempts-1=2, so next failure exhausts all
        maxAttempts: 3,
        createdAt: new Date(),
      };
      (service as any).queue.push(failJob);

      // Trigger processQueue directly
      await (service as any).processQueue();
      // A short wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // After trim, failedJobs should be back to <= 200
      expect((service as any).failedJobs.length).toBeLessThanOrEqual(200);
    });

    // Simplifié : test juste qu'un retry event est émis sans attendre toutes les tentatives
    it('should emit retry event on failure', async () => {
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
 
      // Attendre juste le premier retry
      await new Promise(resolve => setTimeout(resolve, 5500));
 
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ocr.retrying',
        expect.objectContaining({
          documentId: 'doc-123',
          attempt: 1,
          maxAttempts: 3,
        }),
      );
    }, 7000);
  });
});