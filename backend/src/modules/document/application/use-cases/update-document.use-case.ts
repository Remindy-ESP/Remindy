import { Injectable, Inject, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UpdateDocumentAppDto } from '../dto/update-document-app.dto';

@Injectable()
export class UpdateDocumentUseCase {
  private readonly logger = new Logger(UpdateDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(documentId: string, userId: string, dto: UpdateDocumentAppDto): Promise<Document> {
    this.logger.log(`Updating document ${documentId} for user ${userId}`);

    // Récupérer le document
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Vérifier que le document appartient à l'utilisateur
    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Si on essaie de lier à un abonnement, vérifier la limite de 5 documents
    if (dto.subscriptionId !== undefined && dto.subscriptionId !== null) {
      const linkedDocuments = await this.documentRepository.findBySubscriptionId(
        dto.subscriptionId,
      );
      const activeLinkedDocs = linkedDocuments.filter(
        doc => doc.id !== documentId && !doc.deletedAt,
      );
      if (activeLinkedDocs.length >= 5) {
        throw new BadRequestException('Maximum 5 documents par abonnement');
      }
    }

    // Appliquer les modifications au document domain
    if (dto.filename || dto.subscriptionId !== undefined) {
      const updatedProps = {
        id: document.id,
        userId: document.userId,
        subscriptionId:
          dto.subscriptionId !== undefined
            ? dto.subscriptionId || undefined
            : document.subscriptionId,
        contractId: document.contractId,
        folderId: dto.folderId !== undefined ? dto.folderId : document.folderId,
        filename: dto.filename || document.filename,
        r2Key: document.r2Key,
        r2Bucket: document.r2Bucket,
        fileHash: document.fileHash,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        ocrText: document.ocrText,
        ocrStatus: document.ocrStatus,
        ocrError: document.ocrError,
        uploadedAt: document.uploadedAt,
        updatedAt: new Date(),
        deletedAt: document.deletedAt,
        parsedProvider: document.parsedProvider,
        parsedAmount: document.parsedAmount,
        parsedCurrency: document.parsedCurrency,
        parsedDate: document.parsedDate,
        parsedFrequency: document.parsedFrequency,
        parsedCategory: document.parsedCategory,
        parsingConfidence: document.parsingConfidence,
      };
      const updatedDocument = new Document(updatedProps);
      const savedDocument = await this.documentRepository.update(documentId, updatedDocument);

      if (!savedDocument) {
        throw new NotFoundException(`Failed to update document ${documentId}`);
      }

      this.logger.log(`Document ${documentId} updated successfully`);
      return savedDocument;
    }

    // Si seulement folder_id change, utiliser la méthode du domain
    if (dto.folderId !== undefined) {
      document.moveToFolder(dto.folderId || undefined);
      const savedDocument = await this.documentRepository.update(documentId, document);

      if (!savedDocument) {
        throw new NotFoundException(`Failed to update document ${documentId}`);
      }

      this.logger.log(`Document ${documentId} moved to folder successfully`);
      return savedDocument;
    }

    // Aucune modification
    return document;
  }
}
