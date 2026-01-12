import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from '../ocr.service';
import Tesseract from 'tesseract.js';

// Mock Tesseract
jest.mock('tesseract.js');

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn();
});

describe('OcrService', () => {
  let service: OcrService;
  let mockWorker: any;

  beforeEach(async () => {
    // Mock Tesseract Worker
    mockWorker = {
      recognize: jest.fn(),
      terminate: jest.fn().mockResolvedValue(undefined),
    };

    (Tesseract.createWorker as jest.Mock) = jest.fn().mockResolvedValue(mockWorker);

    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractText', () => {
    it('should extract text from PDF using pdf-parse', async () => {
      const pdfBuffer = Buffer.from('fake pdf content');
      const mimeType = 'application/pdf';

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({
        text: 'Extracted PDF text\nLine 2\nLine 3',
      });

      const result = await service.extractText(pdfBuffer, mimeType);

      expect(result).toBe('Extracted PDF text\nLine 2\nLine 3');
      expect(pdfParse).toHaveBeenCalledWith(pdfBuffer, { max: 0 });
    });

    it('should extract text from image using Tesseract', async () => {
      const imageBuffer = Buffer.from('fake image content');
      const mimeType = 'image/jpeg';

      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'Extracted image text',
          confidence: 95.5,
        },
      });

      const result = await service.extractText(imageBuffer, mimeType);

      expect(result).toBe('Extracted image text');
      expect(Tesseract.createWorker).toHaveBeenCalled();
      expect(mockWorker.recognize).toHaveBeenCalledWith(imageBuffer);
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should throw error for unsupported file type', async () => {
      const buffer = Buffer.from('content');
      const mimeType = 'text/plain';

      await expect(service.extractText(buffer, mimeType)).rejects.toThrow(
        'Failed to extract text: Unsupported file type: text/plain',
      );
    });

    it('should return empty string when PDF extraction returns empty text', async () => {
      const pdfBuffer = Buffer.from('fake pdf content');
      const mimeType = 'application/pdf';

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({ text: '' });

      const result = await service.extractText(pdfBuffer, mimeType);
      expect(result).toBe('');
    });

    it('should throw error when PDF extraction fails', async () => {
      const pdfBuffer = Buffer.from('fake pdf content');
      const mimeType = 'application/pdf';

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('PDF error'));

      await expect(service.extractText(pdfBuffer, mimeType)).rejects.toThrow(
        'Failed to extract text: Failed to extract text from PDF: PDF error',
      );
    });

    it('should return empty string when image OCR returns empty text', async () => {
      const imageBuffer = Buffer.from('fake image content');
      const mimeType = 'image/jpeg';

      mockWorker.recognize.mockResolvedValueOnce({
        data: { text: '', confidence: 0 },
      });

      const result = await service.extractText(imageBuffer, mimeType);
      expect(result).toBe('');
    });

    it('should throw error when image OCR fails', async () => {
      const imageBuffer = Buffer.from('fake image content');
      const mimeType = 'image/jpeg';

      mockWorker.recognize.mockRejectedValueOnce(new Error('OCR error'));

      await expect(service.extractText(imageBuffer, mimeType)).rejects.toThrow(
        'Failed to extract text: Failed to extract text from image: OCR error',
      );
    });

    it('should handle error when Tesseract terminate fails', async () => {
      const imageBuffer = Buffer.from('fake image content');
      const mimeType = 'image/jpeg';

      mockWorker.recognize.mockResolvedValueOnce({
        data: { text: 'some text', confidence: 90 },
      });
      mockWorker.terminate.mockRejectedValueOnce(new Error('Terminate error'));

      // Should still return the text even if terminate fails (internal error is logged but not thrown)
      const result = await service.extractText(imageBuffer, mimeType);
      expect(result).toBe('some text');
    });

    it('should handle Tesseract logger progress status', async () => {
      const imageBuffer = Buffer.from('fake image content');
      const mimeType = 'image/jpeg';

      mockWorker.recognize.mockResolvedValueOnce({
        data: { text: 'some text', confidence: 90 },
      });

      // Manually trigger the mock factory for createWorker to see if we can capture the logger
      // Actually, createWorker is mocked in beforeEach:
      // (Tesseract.createWorker as jest.Mock) = jest.fn().mockResolvedValue(mockWorker);
      // We need to check if the 3rd argument (options) has a logger that we can call.

      const result = await service.extractText(imageBuffer, mimeType);
      expect(result).toBe('some text');

      const createWorkerArgs = (Tesseract.createWorker as jest.Mock).mock.calls[0];
      const logger = createWorkerArgs[2].logger;

      // Call the logger to cover the branch inside
      logger({ status: 'recognizing text', progress: 0.5 });
      logger({ status: 'other status', progress: 0.1 });
    });
  });

  describe('isSupportedMimeType', () => {
    it('should return true for PDF', () => {
      expect(service.isSupportedMimeType('application/pdf')).toBe(true);
    });

    it('should return true for supported image types', () => {
      expect(service.isSupportedMimeType('image/jpeg')).toBe(true);
      expect(service.isSupportedMimeType('image/png')).toBe(true);
      expect(service.isSupportedMimeType('image/webp')).toBe(true);
    });

    it('should return false for unsupported MIME types', () => {
      expect(service.isSupportedMimeType('text/plain')).toBe(false);
      expect(service.isSupportedMimeType('video/mp4')).toBe(false);
    });
  });

  describe('cleanExtractedText', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.cleanExtractedText(null as any)).toBe('');
      expect(service.cleanExtractedText('')).toBe('');
    });

    it('should clean spaces, tabs and newlines', () => {
      const input = '  Line 1   \n\n\nLine 2\twith tabs\n   Line 3  ';
      const expected = 'Line 1\n\nLine 2 with tabs\nLine 3';
      expect(service.cleanExtractedText(input)).toBe(expected);
    });

    it('should reduce multiple newlines to max two', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      expect(service.cleanExtractedText(input)).toBe('Line 1\n\nLine 2');
    });

    it('should reduce multiple spaces to one', () => {
      const input = 'Word1    Word2';
      expect(service.cleanExtractedText(input)).toBe('Word1 Word2');
    });
  });
});
