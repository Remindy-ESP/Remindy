import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';

export interface DocumentDeletedEvent {
  documentId: string;
  userId: string;
  fileSize: number;
  r2Key: string;
  r2Deleted: boolean;
}

@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly r2Service: CloudflareR2Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findById(id);

    if (!document || document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const deleted = await this.documentRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    let r2Deleted = false;
    try {
      await this.r2Service.deleteFile(document.r2Key);
      r2Deleted = true;
      this.logger.log(
        `Document ${id} deleted for user ${userId}, freed ${Number(document.fileSize)} bytes (R2 key: ${document.r2Key})`,
      );
    } catch (error) {
      this.logger.error(
        `Orphaned R2 file after document ${id} soft-delete (user ${userId}, key ${document.r2Key}): ${error.message}`,
        error.stack,
      );
    }

    const payload: DocumentDeletedEvent = {
      documentId: id,
      userId,
      fileSize: Number(document.fileSize),
      r2Key: document.r2Key,
      r2Deleted,
    };
    this.eventEmitter.emit('document.deleted', payload);
  }
}
