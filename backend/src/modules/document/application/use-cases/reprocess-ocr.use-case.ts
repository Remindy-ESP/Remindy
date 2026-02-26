import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { ReprocessOcrAppDto } from '../dto/reprocess-ocr-app.dto';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';

@Injectable()
export class ReprocessOcrUseCase {
  private readonly logger = new Logger(ReprocessOcrUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly queueService: InMemoryQueueService,
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

    // Trigger OCR processing by adding to queue
    if (!updated.id) {
      throw new NotFoundException('Document ID is missing');
    }

    try {
      const jobId = await this.queueService.addDocumentToQueue(
        updated.id,
        updated.userId,
        updated.r2Key,
        updated.mimeType,
        updated.filename,
      );

      this.logger.log(
        `Document ${updated.id} added to OCR queue for reprocessing with job ID ${jobId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to add document to queue for reprocessing: ${error.message}`);
      // Mark as failed since we couldn't queue it
      await this.documentRepository.updateOcrStatus(
        updated.id,
        'failed',
        `Failed to queue for reprocessing: ${error.message}`,
      );
      throw new BadRequestException('Failed to initiate OCR reprocessing');
    }

    return updated;
  }
}
