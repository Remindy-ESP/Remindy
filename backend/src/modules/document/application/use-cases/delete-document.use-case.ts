import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
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

    // Soft delete
    const deleted = await this.documentRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // TODO: Delete file from R2 (not implemented yet)
  }
}
