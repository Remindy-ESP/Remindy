import {
  OcrCompletedEvent,
  OcrFailedEvent,
  OcrStartedEvent,
  OcrRetryingEvent,
} from '../ocr.events';

describe('OCR Events', () => {
  describe('OcrStartedEvent', () => {
    it('should expose constructor arguments as readonly properties', () => {
      const event = new OcrStartedEvent('doc-1', 'user-1', 'invoice.pdf');

      expect(event.documentId).toBe('doc-1');
      expect(event.userId).toBe('user-1');
      expect(event.filename).toBe('invoice.pdf');
    });
  });

  describe('OcrCompletedEvent', () => {
    it('should expose constructor arguments as readonly properties', () => {
      const parsedData = {
        provider: 'Netflix',
        amount: 12.99,
        currency: 'EUR',
        date: new Date('2026-01-01'),
        frequency: 'monthly',
        category: 'streaming',
        confidence: 0.95,
      };
      const event = new OcrCompletedEvent(
        'doc-1',
        'user-1',
        'invoice.pdf',
        'extracted text',
        parsedData,
        1234,
      );

      expect(event.documentId).toBe('doc-1');
      expect(event.userId).toBe('user-1');
      expect(event.filename).toBe('invoice.pdf');
      expect(event.ocrText).toBe('extracted text');
      expect(event.parsedData).toEqual(parsedData);
      expect(event.processingTime).toBe(1234);
    });

    it('should accept empty parsedData', () => {
      const event = new OcrCompletedEvent('doc-1', 'user-1', 'f.pdf', '', {}, 0);

      expect(event.parsedData).toEqual({});
      expect(event.processingTime).toBe(0);
    });
  });

  describe('OcrFailedEvent', () => {
    it('should expose constructor arguments as readonly properties', () => {
      const event = new OcrFailedEvent('doc-1', 'user-1', 'invoice.pdf', 'Some error', 3);

      expect(event.documentId).toBe('doc-1');
      expect(event.userId).toBe('user-1');
      expect(event.filename).toBe('invoice.pdf');
      expect(event.error).toBe('Some error');
      expect(event.attempts).toBe(3);
    });
  });

  describe('OcrRetryingEvent', () => {
    it('should expose constructor arguments as readonly properties', () => {
      const event = new OcrRetryingEvent('doc-1', 'user-1', 'invoice.pdf', 2, 3, 'Timeout');

      expect(event.documentId).toBe('doc-1');
      expect(event.userId).toBe('user-1');
      expect(event.filename).toBe('invoice.pdf');
      expect(event.attemptNumber).toBe(2);
      expect(event.maxAttempts).toBe(3);
      expect(event.error).toBe('Timeout');
    });
  });
});
