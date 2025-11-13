import { Injectable, Logger } from '@nestjs/common';
import Tesseract from 'tesseract.js';

// Import pdf-parse avec require pour compatibilité CommonJS
const pdf = require('pdf-parse');

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Extrait le texte d'un fichier (PDF ou Image)
   * @param fileBuffer Buffer du fichier
   * @param mimeType Type MIME du fichier
   * @returns Texte extrait
   */
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPdf(fileBuffer);
      } else if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(fileBuffer);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(`OCR extraction failed: ${error.message}`, error.stack);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extrait le texte d'un PDF en utilisant pdf-parse
   * @param pdfBuffer Buffer du fichier PDF
   * @returns Texte extrait
   */
  private async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
      this.logger.log('Extracting text from PDF...');

      const data = await pdf(pdfBuffer, {
        max: 0, // Parse toutes les pages
      });

      const text = data.text.trim();

      if (!text || text.length === 0) {
        this.logger.warn('PDF extraction returned empty text');
        return '';
      }

      this.logger.log(`PDF text extracted successfully (${text.length} characters)`);
      return text;
    } catch (error) {
      this.logger.error(`PDF extraction failed: ${error.message}`, error.stack);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extrait le texte d'une image en utilisant Tesseract OCR
   * @param imageBuffer Buffer de l'image
   * @returns Texte extrait
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    let worker: Tesseract.Worker | null = null;

    try {
      this.logger.log('Extracting text from image using Tesseract OCR...');

      // Créer un worker Tesseract pour le français et l'anglais
      worker = await Tesseract.createWorker(['fra', 'eng'], 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Lancer la reconnaissance OCR
      const {
        data: { text, confidence },
      } = await worker.recognize(imageBuffer);

      const cleanedText = text.trim();

      if (!cleanedText || cleanedText.length === 0) {
        this.logger.warn('Image OCR returned empty text');
        return '';
      }

      this.logger.log(
        `Image OCR completed successfully (${cleanedText.length} characters, confidence: ${Math.round(confidence)}%)`,
      );

      return cleanedText;
    } catch (error) {
      this.logger.error(`Image OCR failed: ${error.message}`, error.stack);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    } finally {
      // Toujours terminer le worker pour libérer les ressources
      if (worker) {
        try {
          await worker.terminate();
          this.logger.debug('Tesseract worker terminated');
        } catch (terminateError) {
          this.logger.error(`Failed to terminate Tesseract worker: ${terminateError.message}`);
        }
      }
    }
  }

  /**
   * Vérifie si le type MIME est supporté pour l'OCR
   * @param mimeType Type MIME à vérifier
   * @returns true si supporté, false sinon
   */
  isSupportedMimeType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ];

    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Nettoie le texte extrait (supprime espaces multiples, sauts de ligne excessifs, etc.)
   * @param text Texte à nettoyer
   * @returns Texte nettoyé
   */
  cleanExtractedText(text: string): string {
    if (!text) {
      return '';
    }

    return (
      text
        // Remplacer les sauts de ligne multiples par un seul
        .replace(/\n{3,}/g, '\n\n')
        // Remplacer les espaces multiples par un seul
        .replace(/[ \t]{2,}/g, ' ')
        // Supprimer les espaces en début et fin de ligne
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Trim final
        .trim()
    );
  }
}
