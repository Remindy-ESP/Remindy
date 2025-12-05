import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { UploadDocumentAppDto } from '../dto/upload-document-app.dto';

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(dto: UploadDocumentAppDto): Promise<Document> {
    // Generate file hash
    const fileHash = createHash('sha256').update(dto.fileBuffer).digest('hex');

    // Generate R2 key (path in bucket)
    const timestamp = Date.now();
    const r2Key = `users/${dto.userId}/documents/${timestamp}-${dto.filename}`;

    // Create domain entity
    const document = new Document({
      userId: dto.userId,
      subscriptionId: dto.subscriptionId,
      contractId: dto.contractId,
      filename: dto.filename,
      r2Key,
      r2Bucket: 'remindy-documents',
      fileHash,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      ocrStatus: 'pending',
    });

    // Save to database
    const savedDocument = await this.documentRepository.create(document);

    // TODO: Upload file to R2 (not implemented yet)
    // TODO: Trigger OCR processing (not implemented yet)

    return savedDocument;
  }
}
