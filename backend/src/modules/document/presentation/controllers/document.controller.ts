import {
  Controller,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  StreamableFile,
  Header,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  Req,
  Inject,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('subscription_id') subscriptionId?: string,
    @Body('contract_id') contractId?: string,
    @Body('folder_id') folderId?: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<DocumentResponseDto> {
    if (!file) throw new BadRequestException('File is required');
    if (file.size === 0) throw new BadRequestException('File is empty (0 bytes)');
    if (!file.originalname?.trim()) throw new BadRequestException('File must have a valid name');

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
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
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

    const document = await this.uploadDocumentUseCase.execute(appDto, userRole);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentGetQuota()
  @Get('quota')
  async getQuota(@CurrentUser('id') userId: string, @CurrentUser('role') role?: string) {
    const usage = await this.quotaService.getUserQuotaUsage(userId, role ?? '');

    return {
      ...usage,
      storageUsedFormatted: this.quotaService.formatBytes(usage.storageUsed),
      maxStorageFormatted: this.quotaService.formatBytes(usage.maxStorage),
    };
  }

  @ApiDocumentQueueStats()
  @Get('queue/stats')
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @ApiDocumentJobStatus()
  @Get('job/:jobId/status')
  async getJobStatus(@Param('jobId') jobId: string) {
    try {
      return await this.queueService.getJobStatus(jobId);
    } catch {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
  }

  @ApiDocumentFindAll()
  @Get()
  async findAll(@Query() filters: DocumentFilterDto, @CurrentUser('id') userId: string) {
    const appFilters = DocumentPresentationMapper.toFilterAppDto(userId, filters);
    const documents = await this.findAllDocumentsUseCase.execute(appFilters);
    return DocumentPresentationMapper.toResponseDtoArray(documents);
  }

  @ApiDocumentFindOne()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const document = await this.documentRepository.findById(id);

    if (document?.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentDownload()
  @Get(':id/download')
  @Header('Content-Disposition', 'attachment')
  async downloadDocument(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const document = await this.documentRepository.findById(id);

    if (document?.userId !== userId) {
      throw new NotFoundException();
    }

    const fileBuffer = await this.r2Service.downloadFile(document.r2Key);

    return new StreamableFile(fileBuffer, {
      type: document.mimeType,
      disposition: `attachment; filename="${document.filename}"`,
    });
  }

  @ApiDocumentUpdate()
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const appDto = DocumentPresentationMapper.toUpdateAppDto(updateDto);
    const document = await this.updateDocumentUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @ApiDocumentDelete()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.deleteDocumentUseCase.execute(id, userId);
  }

  @ApiDocumentReprocessOcr()
  @Post(':id/reprocess-ocr')
  @HttpCode(HttpStatus.OK)
  async reprocessOcr(
    @Param('id') id: string,
    @Body() dto: ReprocessOcrDto,
    @CurrentUser('id') userId: string,
  ) {
    const appDto = DocumentPresentationMapper.toReprocessOcrAppDto(dto);
    const document = await this.reprocessOcrUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }
}
