import {
  Controller,
  Body,
  Param,
  Query,
  UseGuards,
  StreamableFile,
  Header,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  Req,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { DocumentResponseDto } from '../dto/document-response.dto';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { ReprocessOcrDto } from '../dto/reprocess-ocr.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from '../../application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from '../../application/use-cases/reprocess-ocr.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { DocumentPresentationMapper } from '../mappers/document-presentation.mapper';
import { UploadDocumentAppDto } from '../../application/dto/upload-document-app.dto';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { DOCUMENT_REPOSITORY } from '../../application/ports/document-repository.interface';
import type { IDocumentRepository } from '../../application/ports/document-repository.interface';
import { QuotaService } from '../../application/services/quota.service';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';
import {
  ApiDocumentUpload,
  ApiDocumentFindOne,
  ApiDocumentUpdate,
  ApiDocumentFindAll,
  ApiDocumentDelete,
  ApiDocumentReprocessOcr,
  ApiDocumentDownload,
  ApiDocumentGetQuota,
  ApiDocumentQueueStats,
  ApiDocumentJobStatus,
} from '../../../../swagger/decorators/api-document.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly findAllDocumentsUseCase: FindAllDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly reprocessOcrUseCase: ReprocessOcrUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly r2Service: CloudflareR2Service,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly quotaService: QuotaService,
    private readonly queueService: InMemoryQueueService,
  ) {}

  @ApiDocumentUpload()
  async upload(
    @Req() req: Request,
    @UploadedFile()
    file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('subscription_id') subscriptionId?: string,
    @Body('contract_id') contractId?: string,
    @Body('folder_id') folderId?: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<DocumentResponseDto> {
    console.log('[DocumentController] Upload request received');
    console.log(
      '[DocumentController] File:',
      file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          }
        : 'NO FILE',
    );
    console.log('[DocumentController] Body:', { subscriptionId, contractId });

    if (!file) {
      console.error('[DocumentController] No file uploaded!');
      throw new BadRequestException('File is required');
    }

    if (file.size === 0) {
      throw new BadRequestException('File is empty (0 bytes)');
    }

    if (!file.originalname || file.originalname.trim().length === 0) {
      throw new BadRequestException('File must have a valid name');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, GIF, BMP, TIFF, WEBP`,
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const appDto: UploadDocumentAppDto = {
      userId,
      filename: file.originalname,
      fileBuffer: file.buffer,
      fileSize: file.size,
      mimeType: file.mimetype,
      subscriptionId,
      contractId: contractId ? parseInt(contractId, 10) : undefined,
      folderId,
    };

    const role = (userRole as 'freemium' | 'premium' | 'admin') || 'freemium';

    const document = await this.uploadDocumentUseCase.execute(appDto, role);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentFindOne()
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentUpdate()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const appDto = DocumentPresentationMapper.toUpdateAppDto(updateDto);
    const document = await this.updateDocumentUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentFindAll()
  async findAll(
    @Query() filters: DocumentFilterDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto[]> {
    const appFilters = DocumentPresentationMapper.toFilterAppDto(userId, filters);
    const documents = await this.findAllDocumentsUseCase.execute(appFilters);
    return DocumentPresentationMapper.toResponseDtoArray(documents);
  }

  @ApiDocumentDelete()
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<void> {
    await this.deleteDocumentUseCase.execute(id, userId);
  }

  @ApiDocumentReprocessOcr()
  async reprocessOcr(
    @Param('id') id: string,
    @Body() reprocessDto: ReprocessOcrDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const appDto = DocumentPresentationMapper.toReprocessOcrAppDto(reprocessDto);
    const document = await this.reprocessOcrUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentDownload()
  @Header('Content-Disposition', 'attachment')
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<StreamableFile> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const fileBuffer = await this.r2Service.downloadFile(document.r2Key);

    return new StreamableFile(fileBuffer, {
      type: document.mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
    });
  }

  @ApiDocumentGetQuota()
  async getQuota(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<any> {
    const role = (userRole as 'freemium' | 'premium' | 'admin') || 'freemium';

    const usage = await this.quotaService.getUserQuotaUsage(userId, role);

    return {
      ...usage,
      storageUsedFormatted: this.quotaService.formatBytes(usage.storageUsed),
      maxStorageFormatted: this.quotaService.formatBytes(usage.maxStorage),
    };
  }

  @ApiDocumentQueueStats()
  async getQueueStats(): Promise<any> {
    return await this.queueService.getQueueStats();
  }

  @ApiDocumentJobStatus()
  async getJobStatus(@Param('jobId') jobId: string): Promise<any> {
    try {
      return await this.queueService.getJobStatus(jobId);
    } catch {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
  }
}
