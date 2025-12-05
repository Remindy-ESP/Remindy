import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDocumentRepository } from '../../application/ports/document-repository.interface';
import { Document } from '../../domain/document.entity';
import { DocumentEntity } from '../persistence/document.entity';
import { DocumentMapper } from '../mappers/document.mapper';
import { DocumentFilterAppDto } from '../../application/dto/document-filter-app.dto';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly repository: Repository<DocumentEntity>,
  ) {}

  async create(document: Document): Promise<Document> {
    const entity = DocumentMapper.toPersistence(document);
    const saved = await this.repository.save(entity);
    return DocumentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Document | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return DocumentMapper.toDomain(entity);
  }

  async findAll(filters: DocumentFilterAppDto): Promise<Document[]> {
    const queryBuilder = this.repository.createQueryBuilder('document');

    // Filter by userId (required)
    queryBuilder.andWhere('document.userId = :userId', { userId: filters.userId });

    if (filters.subscriptionId) {
      queryBuilder.andWhere('document.subscriptionId = :subscriptionId', {
        subscriptionId: filters.subscriptionId,
      });
    }

    if (filters.contractId !== undefined) {
      queryBuilder.andWhere('document.contractId = :contractId', {
        contractId: filters.contractId,
      });
    }

    if (filters.ocrStatus) {
      queryBuilder.andWhere('document.ocrStatus = :ocrStatus', {
        ocrStatus: filters.ocrStatus,
      });
    }

    if (filters.mimeType) {
      queryBuilder.andWhere('document.mimeType = :mimeType', {
        mimeType: filters.mimeType,
      });
    }

    // Sorting
    const sort = filters.sort ?? 'uploaded_at:desc';
    const [field, order] = sort.split(':');
    const orderField = field === 'uploaded_at' ? 'document.uploadedAt' : 'document.updatedAt';
    const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(orderField, orderDirection);

    // Limit
    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    const entities = await queryBuilder.getMany();
    return DocumentMapper.toDomainArray(entities);
  }

  async update(id: string, document: Document): Promise<Document | null> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      return null;
    }

    const entity = DocumentMapper.toPersistence(document);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return DocumentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
