import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentEntity } from './infrastructure/persistence/document.entity';
import { DocumentController } from './presentation/controllers/document.controller';
import { DocumentRepository } from './infrastructure/repositories/document.repository';
import { DOCUMENT_REPOSITORY } from './application/ports/document-repository.interface';
import { UploadDocumentUseCase } from './application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from './application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from './application/use-cases/reprocess-ocr.use-case';
import { UpdateDocumentUseCase } from './application/use-cases/update-document.use-case';
import { CloudflareR2Service } from './infrastructure/services/cloudflare-r2.service';
import { OcrService } from './infrastructure/services/ocr.service';
import { GeminiParserService } from './infrastructure/services/gemini-parser.service';
import { QuotaService } from './application/services/quota.service';
import { InMemoryQueueService } from './infrastructure/queue/in-memory-queue.service';
import { OcrEventListener } from './application/events/ocr-event.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    EventEmitterModule.forRoot(),
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory (will be uploaded to R2)
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1, // Only 1 file at a time
      },
    }),
  ],
  controllers: [DocumentController],
  providers: [
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: DocumentRepository,
    },
    CloudflareR2Service,
    OcrService,
    GeminiParserService,
    QuotaService,
    UploadDocumentUseCase,
    FindAllDocumentsUseCase,
    DeleteDocumentUseCase,
    ReprocessOcrUseCase,
    UpdateDocumentUseCase,
    InMemoryQueueService,
    OcrEventListener,
  ],
  exports: [DOCUMENT_REPOSITORY, InMemoryQueueService],
})
export class DocumentModule { }
