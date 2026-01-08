import { Test, TestingModule } from '@nestjs/testing';
import { OcrEventListener } from '../ocr-event.listener';

describe('OcrEventListener', () => {
  let listener: OcrEventListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrEventListener],
    }).compile();

    listener = module.get<OcrEventListener>(OcrEventListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOcrStarted', () => {
    it('should handle OCR started event', () => {
      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
      };

      expect(() => listener.handleOcrStarted(payload)).not.toThrow();
    });

    it('should log document information', () => {
      const logSpy = jest.spyOn(listener['logger'], 'log');

      const payload = {
        documentId: 'doc-456',
        userId: 'user-456',
        filename: 'invoice.pdf',
      };

      listener.handleOcrStarted(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('OCR started for document doc-456'),
      );
    });
  });

  describe('handleOcrCompleted', () => {
    it('should handle OCR completed event successfully', () => {
      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Extracted text content',
        parsedData: {
          provider: 'Netflix',
          amount: 12.99,
          currency: 'EUR',
          confidence: 0.95,
        },
        processingTime: 5000,
      };

      expect(() => listener.handleOcrCompleted(payload)).not.toThrow();
    });

    it('should log completion with processing time', () => {
      const logSpy = jest.spyOn(listener['logger'], 'log');

      const payload = {
        documentId: 'doc-789',
        userId: 'user-789',
        filename: 'document.pdf',
        ocrText: 'Text',
        parsedData: {},
        processingTime: 3500,
      };

      listener.handleOcrCompleted(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('completed successfully'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('3500ms'),
      );
    });

    it('should log detected provider', () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: {
          provider: 'Spotify',
        },
        processingTime: 2000,
      };

      listener.handleOcrCompleted(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Provider detected: Spotify'),
      );
    });

    it('should log detected amount and currency', () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: {
          amount: 29.99,
          currency: 'EUR',
        },
        processingTime: 2000,
      };

      listener.handleOcrCompleted(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('29.99 EUR'),
      );
    });

    it('should log parsing confidence', () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: {
          confidence: 0.87,
        },
        processingTime: 2000,
      };

      listener.handleOcrCompleted(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('87.0%'),
      );
    });
  });

  describe('handleOcrFailed', () => {
    it('should handle OCR failed event', () => {
      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        error: 'OCR extraction failed',
        attempts: 3,
      };

      expect(() => listener.handleOcrFailed(payload)).not.toThrow();
    });

    it('should log error details', () => {
      const errorSpy = jest.spyOn(listener['logger'], 'error');

      const payload = {
        documentId: 'doc-456',
        userId: 'user-456',
        filename: 'corrupted.pdf',
        error: 'Invalid PDF format',
        attempts: 3,
      };

      listener.handleOcrFailed(payload);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('OCR failed for document doc-456'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 attempts'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid PDF format'),
      );
    });
  });

  describe('handleOcrRetrying', () => {
    it('should handle OCR retrying event', () => {
      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        attemptNumber: 2,
        maxAttempts: 3,
        error: 'Temporary network error',
      };

      expect(() => listener.handleOcrRetrying(payload)).not.toThrow();
    });

    it('should log retry attempt information', () => {
      const warnSpy = jest.spyOn(listener['logger'], 'warn');

      const payload = {
        documentId: 'doc-789',
        userId: 'user-789',
        filename: 'document.pdf',
        attemptNumber: 1,
        maxAttempts: 3,
        error: 'Timeout',
      };

      listener.handleOcrRetrying(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OCR retrying for document doc-789'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('attempt 1/3'),
      );
    });

    it('should warn on last retry attempt', () => {
      const warnSpy = jest.spyOn(listener['logger'], 'warn');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        attemptNumber: 2,
        maxAttempts: 3,
        error: 'Error',
      };

      listener.handleOcrRetrying(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('last retry attempt'),
      );
    });

    it('should not warn on non-last attempts', () => {
      const warnSpy = jest.spyOn(listener['logger'], 'warn');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        attemptNumber: 0,
        maxAttempts: 3,
        error: 'Error',
      };

      listener.handleOcrRetrying(payload);

      const lastRetryCall = warnSpy.mock.calls.find(call =>
        call[0].includes('last retry'),
      );
      expect(lastRetryCall).toBeUndefined();
    });
  });

  describe('trackOcrStats', () => {
    it('should track OCR statistics', async () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: {
          provider: 'Netflix',
          amount: 12.99,
          currency: 'EUR',
          confidence: 0.95,
        },
        processingTime: 4500,
      };

      await listener.trackOcrStats(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('OCR Stats'),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"processingTime":4500'),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"confidence":0.95'),
      );
    });

    it('should count extracted fields correctly', async () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: {
          provider: 'Netflix',
          amount: 12.99,
          currency: 'EUR',
          // undefined fields should not be counted
          date: undefined,
          frequency: undefined,
        },
        processingTime: 3000,
      };

      await listener.trackOcrStats(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"fieldsExtracted":3'),
      );
    });
  });

  describe('createNotification', () => {
    it('should create notification for success', () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        ocrText: 'Text',
        parsedData: { provider: 'Netflix' },
        processingTime: 2000,
      };

      listener.handleOcrCompleted(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NOTIFICATION]'),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('success'),
      );
    });

    it('should create notification for error', () => {
      const debugSpy = jest.spyOn(listener['logger'], 'debug');

      const payload = {
        documentId: 'doc-123',
        userId: 'user-123',
        filename: 'test.pdf',
        error: 'Failed',
        attempts: 3,
      };

      listener.handleOcrFailed(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NOTIFICATION]'),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('error'),
      );
    });
  });
});
