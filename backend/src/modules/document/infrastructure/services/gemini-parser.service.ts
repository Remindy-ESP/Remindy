import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParsedDocumentData {
  provider?: string;
  amount?: number;
  currency?: string;
  date?: Date;
  frequency?: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel';
  category?: 'énergie' | 'internet' | 'assurance' | 'SaaS' | 'téléphone' | 'streaming' | 'autre';
  confidence?: number;
}

@Injectable()
export class GeminiParserService {
  private readonly logger = new Logger(GeminiParserService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in .env');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    this.logger.log('Gemini Parser service initialized');
  }

  /**
   * Parse intelligemment le texte OCR pour extraire les informations structurées
   * @param ocrText Texte brut extrait par OCR
   * @returns Données parsées (fournisseur, montant, date, fréquence, catégorie)
   */
  async parseDocument(ocrText: string): Promise<ParsedDocumentData> {
    try {
      if (!ocrText || ocrText.trim().length === 0) {
        this.logger.warn('Empty OCR text provided to parser');
        return {};
      }

      this.logger.log('Parsing document with Gemini...');

      const prompt = this.buildPrompt(ocrText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsedData = this.parseGeminiResponse(text);

      this.logger.log(`Document parsed successfully (confidence: ${parsedData.confidence})`);
      return parsedData;
    } catch (error) {
      this.logger.error(`Gemini parsing failed: ${error.message}`, error.stack);
      // Retourner un objet vide plutôt que de throw pour ne pas bloquer l'upload
      return { confidence: 0 };
    }
  }

  /**
   * Construit le prompt pour Gemini
   */
  private buildPrompt(ocrText: string): string {
    return `
Tu es un assistant intelligent spécialisé dans l'extraction d'informations de documents (factures, contrats, abonnements).

Analyse le texte suivant et extrait les informations demandées au format JSON strict :

TEXTE À ANALYSER :
"""
${ocrText.substring(0, 5000)}
"""

INSTRUCTIONS :
1. Extrais UNIQUEMENT les informations suivantes :
   - provider : nom du fournisseur/entreprise (ex: "EDF", "Orange", "Netflix")
   - amount : montant numérique (ex: 49.99)
   - currency : devise (EUR, USD, etc.)
   - date : date au format YYYY-MM-DD (date de début ou d'échéance)
   - frequency : "mensuel", "trimestriel", "semestriel", "annuel" ou "ponctuel"
   - category : "énergie", "internet", "assurance", "SaaS", "téléphone", "streaming" ou "autre"

2. Si une information n'est pas trouvée, mets null
3. Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après
4. Ne mets pas de commentaires dans le JSON

EXEMPLE DE RÉPONSE ATTENDUE :
{
  "provider": "Orange",
  "amount": 29.99,
  "currency": "EUR",
  "date": "2024-01-15",
  "frequency": "mensuel",
  "category": "internet"
}

RÉPONDS MAINTENANT :`;
  }

  /**
   * Parse la réponse de Gemini et extrait les données structurées
   */
  private parseGeminiResponse(responseText: string): ParsedDocumentData {
    try {
      // Nettoyer la réponse (enlever markdown code blocks si présents)
      let cleanedText = responseText.trim();

      // Enlever les blocs de code markdown
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Parser le JSON
      const parsed = JSON.parse(cleanedText);

      // Convertir la date string en Date
      let parsedDate: Date | undefined;
      if (parsed.date) {
        try {
          parsedDate = new Date(parsed.date);
          if (isNaN(parsedDate.getTime())) {
            parsedDate = undefined;
          }
        } catch {
          parsedDate = undefined;
        }
      }

      // Calculer un score de confiance basé sur les champs remplis
      const confidence = this.calculateConfidence({
        provider: parsed.provider,
        amount: parsed.amount,
        currency: parsed.currency,
        date: parsedDate,
        frequency: parsed.frequency,
        category: parsed.category,
      });

      return {
        provider: parsed.provider || undefined,
        amount: parsed.amount ? parseFloat(parsed.amount) : undefined,
        currency: parsed.currency || 'EUR',
        date: parsedDate,
        frequency: this.normalizeFrequency(parsed.frequency),
        category: this.normalizeCategory(parsed.category),
        confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to parse Gemini response: ${error.message}`);
      this.logger.debug(`Raw response: ${responseText}`);

      // Fallback : essayer d'extraire avec des regex simples
      return this.fallbackParsing(responseText);
    }
  }

  /**
   * Normalise la fréquence
   */
  private normalizeFrequency(
    frequency: string,
  ): 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel' | undefined {
    if (!frequency) return undefined;

    const normalized = frequency.toLowerCase().trim();
    const validFrequencies = ['mensuel', 'trimestriel', 'semestriel', 'annuel', 'ponctuel'];

    return validFrequencies.includes(normalized) ? (normalized as any) : undefined;
  }

  /**
   * Normalise la catégorie
   */
  private normalizeCategory(
    category: string,
  ):
    | 'énergie'
    | 'internet'
    | 'assurance'
    | 'SaaS'
    | 'téléphone'
    | 'streaming'
    | 'autre'
    | undefined {
    if (!category) return undefined;

    const normalized = category.toLowerCase().trim();
    const validCategories = [
      'énergie',
      'internet',
      'assurance',
      'saas',
      'téléphone',
      'streaming',
      'autre',
    ];

    return validCategories.includes(normalized) ? (normalized as any) : 'autre';
  }

  /**
   * Calcule un score de confiance basé sur les champs extraits
   */
  private calculateConfidence(data: Partial<ParsedDocumentData>): number {
    let score = 0;
    let total = 6;

    if (data.provider) score += 1;
    if (data.amount && data.amount > 0) score += 1;
    if (data.currency) score += 1;
    if (data.date) score += 1;
    if (data.frequency) score += 1;
    if (data.category) score += 1;

    return Math.round((score / total) * 100) / 100;
  }

  /**
   * Parsing de secours avec regex si Gemini échoue
   */
  private fallbackParsing(text: string): ParsedDocumentData {
    this.logger.warn('Using fallback parsing with regex');

    const data: ParsedDocumentData = {
      confidence: 0.3, // Faible confiance pour le fallback
    };

    // Extraire le montant
    const amountMatch = text.match(/(\d+[,.]?\d*)\s*(?:€|EUR|euros?)/i);
    if (amountMatch) {
      data.amount = parseFloat(amountMatch[1].replace(',', '.'));
      data.currency = 'EUR';
    }

    // Extraire une date
    const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (dateMatch) {
      try {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);
        data.date = new Date(year, month - 1, day);
      } catch {
        // Ignorer si la date est invalide
      }
    }

    // Extraire la fréquence
    if (/mensuel/i.test(text)) data.frequency = 'mensuel';
    else if (/annuel/i.test(text)) data.frequency = 'annuel';
    else if (/trimestriel/i.test(text)) data.frequency = 'trimestriel';

    // Extraire la catégorie
    if (/électricité|edf|engie|gaz/i.test(text)) data.category = 'énergie';
    else if (/internet|orange|free|sfr|bouygues|box/i.test(text)) data.category = 'internet';
    else if (/assurance|axa|allianz|maif/i.test(text)) data.category = 'assurance';
    else if (/netflix|spotify|disney|prime/i.test(text)) data.category = 'streaming';

    return data;
  }
}
