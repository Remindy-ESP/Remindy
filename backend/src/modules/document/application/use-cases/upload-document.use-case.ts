import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UploadDocumentAppDto } from '../dto/upload-document-app.dto';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { QuotaService, UserRole } from '../services/quota.service';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';

@Injectable()
export class UploadDocumentUseCase {
  private readonly logger = new Logger(UploadDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly r2Service: CloudflareR2Service,
    private readonly quotaService: QuotaService,
    private readonly queueService: InMemoryQueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: UploadDocumentAppDto, userRole: UserRole = 'freemium'): Promise<Document> {
    try {
      this.logger.log(`Starting document upload for user ${dto.userId}`);

      // Vérifier les quotas utilisateur AVANT l'upload
      await this.quotaService.checkUserQuota(dto.userId, userRole, dto.fileSize);
      this.logger.log(`Quota check passed for user ${dto.userId}`);

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
      const folderId = dto.folderId && dto.folderId.trim() !== '' ? dto.folderId : undefined;

      // Create domain entity avec statut "pending" (sera traité par la queue)
      const document = new Document({
        userId: dto.userId,
        subscriptionId,
        contractId,
        folderId,
        filename: dto.filename,
        r2Key,
        r2Bucket: 'remindy-documents',
        fileHash,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        ocrStatus: 'pending', // La queue changera à "processing"
      });

      // Save to database
      const savedDocument = await this.documentRepository.create(document);

      // ÉTAPE 2 : Ajouter le document à la queue pour traitement OCR asynchrone
      if (savedDocument.id) {
        this.logger.log(`Adding document ${savedDocument.id} to OCR queue`);

        try {
          const jobId = await this.queueService.addDocumentToQueue(
            savedDocument.id,
            dto.userId,
            r2Key,
            dto.mimeType,
            dto.filename,
          );

          this.logger.log(`Document ${savedDocument.id} added to queue with job ID ${jobId}`);

          // Émettre un événement pour notifier le début du traitement
          this.eventEmitter.emit('ocr.started', {
            documentId: savedDocument.id,
            userId: dto.userId,
            filename: dto.filename,
          });
        } catch (error) {
          this.logger.error(`Failed to add document to queue: ${error.message}`);
          // Marquer comme failed si on ne peut pas ajouter à la queue
          await this.documentRepository.updateOcrStatus(
            savedDocument.id,
            'failed',
            `Failed to queue for processing: ${error.message}`,
          );
        }
      }

      return savedDocument;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
