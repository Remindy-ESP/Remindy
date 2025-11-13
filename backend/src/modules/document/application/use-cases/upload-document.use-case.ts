import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UploadDocumentAppDto } from '../dto/upload-document-app.dto';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { OcrService } from '../../infrastructure/services/ocr.service';
import { GeminiParserService } from '../../infrastructure/services/gemini-parser.service';

@Injectable()
export class UploadDocumentUseCase {
  private readonly logger = new Logger(UploadDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly r2Service: CloudflareR2Service,
    private readonly ocrService: OcrService,
    private readonly geminiParser: GeminiParserService,
  ) {}

  async execute(dto: UploadDocumentAppDto): Promise<Document> {
    try {
      this.logger.log(`Starting document upload for user ${dto.userId}`);

      // Generate file hash
      const fileHash = createHash('sha256').update(dto.fileBuffer).digest('hex');

      // Generate R2 key (path in bucket)
      const timestamp = Date.now();
      const r2Key = `users/${dto.userId}/documents/${timestamp}-${dto.filename}`;

      // ÉTAPE 1 : Upload vers Cloudflare R2
      this.logger.log(`Uploading file to R2: ${r2Key}`);
      const fileUrl = await this.r2Service.uploadFile(dto.fileBuffer, r2Key, dto.mimeType);
      this.logger.log(`File uploaded successfully to R2`);

      // Convertir les chaînes vides en undefined pour éviter les erreurs de validation UUID
      const subscriptionId =
        dto.subscriptionId && dto.subscriptionId.trim() !== '' ? dto.subscriptionId : undefined;
      const contractId = dto.contractId && dto.contractId > 0 ? dto.contractId : undefined;

      // Create domain entity
      const document = new Document({
        userId: dto.userId,
        subscriptionId,
        contractId,
        filename: dto.filename,
        r2Key,
        r2Bucket: 'remindy-documents',
        fileHash,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        ocrStatus: 'processing',
      });

      // Save to database (avec statut processing)
      let savedDocument = await this.documentRepository.create(document);

      // ÉTAPE 2 : Extraire le texte (OCR) de manière asynchrone
      if (savedDocument.id) {
        this.processOcrAndParsing(savedDocument.id, dto.fileBuffer, dto.mimeType).catch(error => {
          this.logger.error(
            `Background OCR/Parsing failed for document ${savedDocument.id}: ${error.message}`,
          );
        });
      }

      return savedDocument;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Traite l'OCR et le parsing en arrière-plan
   */
  private async processOcrAndParsing(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      // ÉTAPE 2 : Extraction OCR
      this.logger.log(`Starting OCR for document ${documentId}`);
      const ocrText = await this.ocrService.extractText(fileBuffer, mimeType);
      const cleanedText = this.ocrService.cleanExtractedText(ocrText);

      if (!cleanedText || cleanedText.length === 0) {
        this.logger.warn(`OCR returned empty text for document ${documentId}`);
        await this.documentRepository.updateOcrStatus(documentId, 'completed', '', undefined);
        return;
      }

      this.logger.log(
        `OCR completed for document ${documentId} (${cleanedText.length} characters)`,
      );

      // ÉTAPE 3 : Parsing intelligent avec Gemini
      this.logger.log(`Starting Gemini parsing for document ${documentId}`);
      const parsedData = await this.geminiParser.parseDocument(cleanedText);
      this.logger.log(`Gemini parsing completed for document ${documentId}`);

      // ÉTAPE 4 : Mettre à jour le document avec OCR + données parsées
      await this.documentRepository.updateOcrAndParsedData(documentId, {
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

      this.logger.log(`Document ${documentId} fully processed (OCR + Parsing)`);
    } catch (error) {
      this.logger.error(`OCR/Parsing failed for document ${documentId}: ${error.message}`);
      await this.documentRepository.updateOcrStatus(documentId, 'failed', undefined, error.message);
    }
  }
}
