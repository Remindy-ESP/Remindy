import { Document } from '../../domain/document.entity';
import { DocumentResponseDto } from '../dto/document-response.dto';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { DocumentFilterAppDto } from '../../application/dto/document-filter-app.dto';
import { ReprocessOcrDto } from '../dto/reprocess-ocr.dto';
import { ReprocessOcrAppDto } from '../../application/dto/reprocess-ocr-app.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { UpdateDocumentAppDto } from '../../application/dto/update-document-app.dto';

export class DocumentPresentationMapper {
  static toResponseDto(document: Document): DocumentResponseDto {
    return {
      id: document.id!,
      user_id: document.userId,
      subscription_id: document.subscriptionId,
      contract_id: document.contractId,
      folder_id: document.folderId,
      filename: document.filename,
      r2_key: document.r2Key,
      r2_bucket: document.r2Bucket,
      file_hash: document.fileHash,
      file_size: document.fileSize,
      mime_type: document.mimeType,
      ocr_text: document.ocrText,
      ocr_status: document.ocrStatus,
      ocr_error: document.ocrError,
      uploaded_at: document.uploadedAt ? new Date(document.uploadedAt).toISOString() : undefined!,
      updated_at: document.updatedAt ? new Date(document.updatedAt).toISOString() : undefined!,
      deleted_at: document.deletedAt ? new Date(document.deletedAt).toISOString() : undefined,
      // Champs parsed par Gemini
      parsed_provider: document.parsedProvider,
      parsed_amount: document.parsedAmount,
      parsed_currency: document.parsedCurrency,
      parsed_date: document.parsedDate ? new Date(document.parsedDate).toISOString().split('T')[0] : undefined,
      parsed_frequency: document.parsedFrequency,
      parsed_category: document.parsedCategory,
      parsing_confidence: document.parsingConfidence,
    };
  }

  static toResponseDtoArray(documents: Document[]): DocumentResponseDto[] {
    return documents.map(document => this.toResponseDto(document));
  }

  static toFilterAppDto(userId: string, dto: DocumentFilterDto): DocumentFilterAppDto {
    return {
      userId,
      subscriptionId: dto.subscription_id,
      contractId: dto.contract_id,
      ocrStatus: dto.ocr_status,
      mimeType: dto.mime_type,
      limit: dto.limit ?? 100,
      sort: dto.sort ?? 'uploaded_at:desc',
    };
  }

  static toReprocessOcrAppDto(dto: ReprocessOcrDto): ReprocessOcrAppDto {
    return {
      force: dto.force ?? false,
    };
  }

  static toUpdateAppDto(dto: UpdateDocumentDto): UpdateDocumentAppDto {
    return {
      filename: dto.filename,
      folderId: dto.folder_id,
      subscriptionId: dto.subscription_id,
    };
  }
}
