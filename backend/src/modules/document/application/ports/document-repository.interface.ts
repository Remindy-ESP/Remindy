import { Document } from '../../domain/document.entity';
import { DocumentFilterAppDto } from '../dto/document-filter-app.dto';

export interface IDocumentRepository {
  create(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findAll(filters: DocumentFilterAppDto): Promise<Document[]>;
  update(id: string, document: Document): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const DOCUMENT_REPOSITORY = Symbol('IDocumentRepository');
