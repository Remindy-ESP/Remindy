import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UseGuards,
  StreamableFile,
  Header,
  NotFoundException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
import { Inject } from '@nestjs/common';
import type { IDocumentRepository } from '../../application/ports/document-repository.interface';
import { QuotaService } from '../../application/services/quota.service';
import { InMemoryQueueService } from '../../infrastructure/queue/in-memory-queue.service';

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


  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload un document (PDF ou image, max 10MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Le fichier à uploader (PDF ou image)',
        },
        subscription_id: {
          type: 'string',
          format: 'uuid',
          description: "ID de l'abonnement lié (optionnel)",
        },
        contract_id: {
          type: 'number',
          description: 'ID du contrat lié (optionnel)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploadé avec succès',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou trop volumineux' })
  async upload(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(pdf|jpeg|jpg|png|gif|bmp|tiff|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('subscription_id') subscriptionId?: string,
    @Body('contract_id') contractId?: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<DocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const appDto: UploadDocumentAppDto = {
      userId,
      filename: file.originalname,
      fileBuffer: file.buffer,
      fileSize: file.size,
      mimeType: file.mimetype,
      subscriptionId,
      contractId: contractId ? parseInt(contractId, 10) : undefined,
    };

    const role = (userRole as 'freemium' | 'premium' | 'admin') || 'freemium';

    const document = await this.uploadDocumentUseCase.execute(appDto, role);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'un document spécifique" })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({
    status: 200,
    description: 'Détails du document',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Vérifier que le document appartient à l'utilisateur
    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return DocumentPresentationMapper.toResponseDto(document);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un document (filename, folder)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiBody({ type: UpdateDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'Document mis à jour avec succès',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const appDto = DocumentPresentationMapper.toUpdateAppDto(updateDto);
    const document = await this.updateDocumentUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les documents avec filtres optionnels' })
  @ApiQuery({
    name: 'subscription_id',
    required: false,
    description: "Filtrer par ID d'abonnement",
  })
  @ApiQuery({ name: 'contract_id', required: false, description: 'Filtrer par ID de contrat' })
  @ApiQuery({
    name: 'ocr_status',
    required: false,
    enum: ['pending', 'processing', 'completed', 'failed'],
    description: 'Filtrer par statut OCR',
  })
  @ApiQuery({ name: 'mime_type', required: false, description: 'Filtrer par type MIME' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Tri (uploaded_at:asc|desc)',
    example: 'uploaded_at:desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents',
    type: [DocumentResponseDto],
  })
  async findAll(
    @Query() filters: DocumentFilterDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto[]> {
    const appFilters = DocumentPresentationMapper.toFilterAppDto(userId, filters);
    const documents = await this.findAllDocumentsUseCase.execute(appFilters);
    return DocumentPresentationMapper.toResponseDtoArray(documents);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un document (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 204, description: 'Document supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.deleteDocumentUseCase.execute(id, userId);
  }

  @Post(':id/reprocess-ocr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Relancer le traitement OCR pour un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({
    status: 200,
    description: 'Traitement OCR relancé avec succès',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  @ApiResponse({ status: 400, description: 'OCR déjà complété (utilisez force=true pour forcer)' })
  async reprocessOcr(
    @Param('id') id: string,
    @Body() reprocessDto: ReprocessOcrDto,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentResponseDto> {
    const appDto = DocumentPresentationMapper.toReprocessOcrAppDto(reprocessDto);
    const document = await this.reprocessOcrUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Fichier téléchargé avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
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
      disposition: `attachment; filename="${document.filename}"`,
    });
  }

  @Get('quota')
  @ApiOperation({ summary: "Consulter l'utilisation des quotas utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des quotas',
    schema: {
      type: 'object',
      properties: {
        documentsCount: { type: 'number', example: 15 },
        maxDocuments: { type: 'number', example: 50 },
        storageUsed: { type: 'number', example: 25600000 },
        maxStorage: { type: 'number', example: 104857600 },
        storageUsedPercent: { type: 'number', example: 24.41 },
        documentsUsedPercent: { type: 'number', example: 30 },
        storageUsedFormatted: { type: 'string', example: '24.41 MB' },
        maxStorageFormatted: { type: 'string', example: '100.00 MB' },
      },
    },
  })
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

  @Get('queue/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de la queue OCR' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de la queue',
    schema: {
      type: 'object',
      properties: {
        waiting: { type: 'number', example: 5 },
        active: { type: 'number', example: 2 },
        completed: { type: 'number', example: 150 },
        failed: { type: 'number', example: 3 },
        delayed: { type: 'number', example: 0 },
      },
    },
  })
  async getQueueStats(): Promise<any> {
    return await this.queueService.getQueueStats();
  }

  @Get('job/:jobId/status')
  @ApiOperation({ summary: "Consulter le statut d'un job OCR spécifique" })
  @ApiParam({ name: 'jobId', description: 'ID du job OCR' })
  @ApiResponse({
    status: 200,
    description: 'Statut du job',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123' },
        status: { type: 'string', example: 'completed' },
        progress: { type: 'number', example: 100 },
        attempts: { type: 'number', example: 1 },
        result: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job non trouvé' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<any> {
    try {
      return await this.queueService.getJobStatus(jobId);
    } catch {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
  }
}
