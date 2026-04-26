import { Document } from '../../domain/document.entity';
import { DocumentEntity } from '../persistence/document.entity';

export class DocumentMapper {
  static toDomain(entity: DocumentEntity): Document {
    const document = new Document({
      id: entity.id,
      userId: entity.userId,
      subscriptionId: entity.subscriptionId,
      contractId: entity.contractId,
      folderId: entity.folderId,
      filename: entity.filename,
      r2Key: entity.r2Key,
      r2Bucket: entity.r2Bucket,
      fileHash: entity.fileHash,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      ocrText: entity.ocrText,
      ocrStatus: entity.ocrStatus,
      ocrError: entity.ocrError,
      uploadedAt: entity.uploadedAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      // Champs parsed par Gemini
      parsedProvider: entity.parsedProvider,
      parsedAmount: entity.parsedAmount,
      parsedCurrency: entity.parsedCurrency,
      parsedDate: entity.parsedDate,
      parsedFrequency: entity.parsedFrequency,
      parsedCategory: entity.parsedCategory,
      parsingConfidence: entity.parsingConfidence,
    });

    return document;
  }

  static toPersistence(document: Document): DocumentEntity {
    const entity = new DocumentEntity();

    if (document.id) {
      entity.id = document.id;
    }
    entity.userId = document.userId;
    entity.subscriptionId = document.subscriptionId;
    entity.contractId = document.contractId;
    entity.folderId = document.folderId;
    entity.filename = document.filename;
    entity.r2Key = document.r2Key;
    entity.r2Bucket = document.r2Bucket;
    entity.fileHash = document.fileHash;
    entity.fileSize = document.fileSize;
    entity.mimeType = document.mimeType;
    entity.ocrText = document.ocrText;
    entity.ocrStatus = document.ocrStatus;
    entity.ocrError = document.ocrError;
    if (document.uploadedAt) {
      entity.uploadedAt = document.uploadedAt;
    }
    if (document.updatedAt) {
      entity.updatedAt = document.updatedAt;
    }
    if (document.deletedAt) {
      entity.deletedAt = document.deletedAt;
    }
    // Champs parsed par Gemini
    entity.parsedProvider = document.parsedProvider;
    entity.parsedAmount = document.parsedAmount;
    entity.parsedCurrency = document.parsedCurrency;
    entity.parsedDate = document.parsedDate;
    entity.parsedFrequency = document.parsedFrequency;
    entity.parsedCategory = document.parsedCategory;
    entity.parsingConfidence = document.parsingConfidence;

    return entity;
  }

  static toDomainArray(entities: DocumentEntity[]): Document[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
