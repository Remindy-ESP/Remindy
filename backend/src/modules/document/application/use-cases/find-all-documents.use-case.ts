import { Injectable, Inject } from '@nestjs/common';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { DocumentFilterAppDto } from '../dto/document-filter-app.dto';

@Injectable()
export class FindAllDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(filters: DocumentFilterAppDto): Promise<Document[]> {
    return await this.documentRepository.findAll(filters);
  }
}
