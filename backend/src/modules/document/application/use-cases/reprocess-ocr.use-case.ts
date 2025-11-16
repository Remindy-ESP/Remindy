import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { ReprocessOcrAppDto } from '../dto/reprocess-ocr-app.dto';

@Injectable()
export class ReprocessOcrUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(id: string, userId: string, dto: ReprocessOcrAppDto): Promise<Document> {
    // Verify document exists and belongs to user
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check if already completed and force not set
    if (document.ocrStatus === 'completed' && !dto.force) {
      throw new BadRequestException('OCR already completed. Use force=true to reprocess.');
    }

    // Check if already processing
    if (document.ocrStatus === 'processing') {
      throw new BadRequestException('OCR is already processing for this document');
    }

    // Retry OCR
    document.retryOcr();

    // Update document
    const updated = await this.documentRepository.update(id, document);

    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // TODO: Trigger OCR processing (not implemented yet)

    return updated;
  }
}
