import { Document } from '../../domain/document.entity';
import { DocumentFilterAppDto } from '../dto/document-filter-app.dto';

export interface IDocumentRepository {
  create(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByUserId(userId: string): Promise<Document[]>;
  findAll(filters: DocumentFilterAppDto): Promise<Document[]>;
  update(id: string, document: Document): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  save(document: Document): Promise<Document>;
  updateOcrStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    ocrText?: string,
    ocrError?: string,
  ): Promise<void>;
  updateOcrAndParsedData(
    id: string,
    data: {
      ocrText: string;
      ocrStatus: 'completed' | 'failed';
      parsedProvider?: string;
      parsedAmount?: number;
      parsedCurrency?: string;
      parsedDate?: Date;
      parsedFrequency?: string;
      parsedCategory?: string;
      parsingConfidence?: number;
    },
  ): Promise<void>;
}

export const DOCUMENT_REPOSITORY = Symbol('IDocumentRepository');
