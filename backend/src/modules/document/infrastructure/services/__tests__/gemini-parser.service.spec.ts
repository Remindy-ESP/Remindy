import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiParserService } from '../gemini-parser.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('GeminiParserService', () => {
  let service: GeminiParserService;
  let mockModel: any;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;

  beforeEach(async () => {
    mockModel = {
      generateContent: jest.fn(),
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    } as any;

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(
      () => mockGenAI,
    );

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiParserService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GeminiParserService>(GeminiParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseDocument', () => {
    it('should parse document data successfully', async () => {
      const ocrText = `
        Facture Netflix
        Montant: 12.99 EUR
        Date: 2025-01-15
        Abonnement mensuel
      `;

      const geminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              provider: 'Netflix',
              amount: 12.99,
              currency: 'EUR',
              date: '2025-01-15',
              frequency: 'mensuel',
              category: 'streaming',
            }),
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);

      expect(result.provider).toBe('Netflix');
      expect(result.amount).toBe(12.99);
      expect(result.currency).toBe('EUR');
      expect(result.date).toBeInstanceOf(Date);
      expect(result.frequency).toBe('mensuel');
      expect(result.category).toBe('streaming');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return empty object for empty OCR text', async () => {
      const result = await service.parseDocument('');

      expect(result).toEqual({});
      expect(mockModel.generateContent).not.toHaveBeenCalled();
    });

    it('should use fallback parsing when Gemini fails', async () => {
      const ocrText = 'Netflix 12.99 EUR mensuel';

      mockModel.generateContent.mockRejectedValueOnce(new Error('Gemini API error'));

      const result = await service.parseDocument(ocrText);

      expect(result.confidence).toBe(0.3);
      expect(result).toBeDefined();
    });

    it('should handle markdown code blocks in response', async () => {
      const ocrText = 'Invoice text';

      const geminiResponse = {
        response: {
          text: () =>
            '```json\n' +
            JSON.stringify({
              provider: 'Orange',
              amount: 29.99,
              currency: 'EUR',
              date: '2025-02-01',
              frequency: 'mensuel',
              category: 'internet',
            }) +
            '\n```',
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);

      expect(result.provider).toBe('Orange');
      expect(result.amount).toBe(29.99);
    });
  });
});
