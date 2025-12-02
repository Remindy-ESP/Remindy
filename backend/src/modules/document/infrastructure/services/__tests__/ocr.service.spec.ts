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
  });

  describe('isSupportedMimeType', () => {
    it('should return true for PDF', () => {
      expect(service.isSupportedMimeType('application/pdf')).toBe(true);
    });

    it('should return true for supported image types', () => {
      expect(service.isSupportedMimeType('image/jpeg')).toBe(true);
      expect(service.isSupportedMimeType('image/png')).toBe(true);
    });

    it('should return false for unsupported MIME types', () => {
      expect(service.isSupportedMimeType('text/plain')).toBe(false);
      expect(service.isSupportedMimeType('video/mp4')).toBe(false);
    });
  });
});
