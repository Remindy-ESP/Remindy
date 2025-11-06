import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './infrastructure/persistence/document.entity';
import { DocumentController } from './presentation/controllers/document.controller';
import { DocumentRepository } from './infrastructure/repositories/document.repository';
import { DOCUMENT_REPOSITORY } from './application/ports/document-repository.interface';
import { UploadDocumentUseCase } from './application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from './application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from './application/use-cases/reprocess-ocr.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity])],
  controllers: [DocumentController],
  providers: [
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: DocumentRepository,
    },
    UploadDocumentUseCase,
    FindAllDocumentsUseCase,
    DeleteDocumentUseCase,
    ReprocessOcrUseCase,
  ],
  exports: [DOCUMENT_REPOSITORY],
})
export class DocumentModule {}
