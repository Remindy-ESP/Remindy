import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';

@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly r2Service: CloudflareR2Service,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    // Verify document exists and belongs to user
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Soft delete from database
    const deleted = await this.documentRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Delete file from R2
    try {
      await this.r2Service.deleteFile(document.r2Key);
      this.logger.log(`File deleted from R2: ${document.r2Key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from R2: ${error.message}`, error.stack);
      // Don't throw error - document is already soft deleted in DB
      // This prevents blocking deletion if R2 fails
    }
  }
}
