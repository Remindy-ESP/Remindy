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

    GoogleGenerativeAI.mockImplementation(() => mockGenAI);

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

    it('should handle invalid date in Gemini response', async () => {
      const ocrText = 'Invoice text';
      const geminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              provider: 'Test',
              date: 'invalid-date',
            }),
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);
      expect(result.date).toBeUndefined();
    });

    it('should handle malformed JSON in Gemini response by using fallback', async () => {
      const ocrText = 'Netflix 12.99 EUR mensuel';
      const geminiResponse = {
        response: {
          text: () => 'Not a JSON response',
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);
      expect(result.provider).toBeUndefined(); // Fallback doesn't extract provider with regex yet
      expect(result.amount).toBe(12.99);
      expect(result.confidence).toBe(0.3);
    });

    it('should normalize frequency and category correctly', async () => {
      const ocrText = 'Invoice text';
      const geminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              frequency: ' MENSUEL ',
              category: ' INTERNET ',
            }),
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);
      expect(result.frequency).toBe('mensuel');
      expect(result.category).toBe('internet');
    });

    it('should use "autre" for unknown category', async () => {
      const ocrText = 'Invoice text';
      const geminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              category: 'unknown-category',
            }),
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);
      expect(result.category).toBe('autre');
    });

    it('should normalize unknown frequency to undefined', async () => {
      const ocrText = 'Invoice text';
      const geminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              frequency: 'unknown-frequency',
            }),
        },
      };

      mockModel.generateContent.mockResolvedValueOnce(geminiResponse);

      const result = await service.parseDocument(ocrText);
      expect(result.frequency).toBeUndefined();
    });

    it('should extract different frequencies in fallback parsing', async () => {
      const textAnnuel = 'Contrat annuel';
      const textTrimestriel = 'Abonnement trimestriel';

      mockModel.generateContent.mockRejectedValue(new Error('error'));

      const resAnnuel = await service.parseDocument(textAnnuel);
      expect(resAnnuel.frequency).toBe('annuel');

      const resTrimestriel = await service.parseDocument(textTrimestriel);
      expect(resTrimestriel.frequency).toBe('trimestriel');
    });

    it('should extract different categories in fallback parsing', async () => {
      const textEnergie = 'Facture EDF';
      const textAssurance = 'Contrat AXA';

      mockModel.generateContent.mockRejectedValue(new Error('error'));

      const resEnergie = await service.parseDocument(textEnergie);
      expect(resEnergie.category).toBe('énergie');

      const resAssurance = await service.parseDocument(textAssurance);
      expect(resAssurance.category).toBe('assurance');
    });

    it('should handle invalid date in fallback parsing', async () => {
      const ocrText = 'Date: abc/def/ghij'; // Definitely non-matching
      mockModel.generateContent.mockRejectedValue(new Error('error'));

      const result = await service.parseDocument(ocrText);
      expect(result.date).toBeUndefined();
    });
  });

  describe('Initialization', () => {
    it('should throw error if GEMINI_API_KEY is missing', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => new GeminiParserService(mockConfigService as any)).toThrow(
        'GEMINI_API_KEY is not configured in .env',
      );
    });
  });
});
