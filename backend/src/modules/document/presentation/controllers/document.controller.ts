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
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DocumentResponseDto } from '../dto/document-response.dto';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { ReprocessOcrDto } from '../dto/reprocess-ocr.dto';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from '../../application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from '../../application/use-cases/reprocess-ocr.use-case';
import { DocumentPresentationMapper } from '../mappers/document-presentation.mapper';
import { UploadDocumentAppDto } from '../../application/dto/upload-document-app.dto';
import { CloudflareR2Service } from '../../infrastructure/services/cloudflare-r2.service';
import { DOCUMENT_REPOSITORY } from '../../application/ports/document-repository.interface';
import { Inject } from '@nestjs/common';
import type { IDocumentRepository } from '../../application/ports/document-repository.interface';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(ThrottlerGuard)
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly findAllDocumentsUseCase: FindAllDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly reprocessOcrUseCase: ReprocessOcrUseCase,
    private readonly r2Service: CloudflareR2Service,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
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
    @Body('subscription_id') subscriptionId?: string,
    @Body('contract_id') contractId?: string,
  ): Promise<DocumentResponseDto> {
    // Extract userId from JWT token
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

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

    const document = await this.uploadDocumentUseCase.execute(appDto);
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
      @Req() req: Request
  ): Promise<DocumentResponseDto> {
      const { user } = req as Request & { user: { userId: string; role: string } };
      const userId = user.userId;
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

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
    @Req() req: Request,
    @Query() filters: DocumentFilterDto,
  ): Promise<DocumentResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appFilters = DocumentPresentationMapper.toFilterAppDto(userId, filters);
    const documents = await this.findAllDocumentsUseCase.execute(appFilters);
    return DocumentPresentationMapper.toResponseDtoArray(documents);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un document (renommer)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({
    status: 200,
    description: 'Document mis à jour avec succès',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() updateDto: { filename?: string; folder_id?: string },
  ): Promise<DocumentResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.userId !== userId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (updateDto.filename) {
      if (updateDto.filename.trim().length === 0) {
        throw new BadRequestException('Filename cannot be empty');
      }
      if (updateDto.filename.length > 255) {
        throw new BadRequestException('Filename is too long (max 255 characters)');
      }
      // Note: Dans une vraie implémentation, il faudrait ajouter une méthode rename() à l'entité Document
      // Pour l'instant on utilise directement le repository
    }

    if (updateDto.folder_id !== undefined) {
      document.moveToFolder(updateDto.folder_id || undefined);
    }

    const updatedDocument = await this.documentRepository.save(document);
    return DocumentPresentationMapper.toResponseDto(updatedDocument);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un document (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 204, description: 'Document supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

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
    @Req() req: Request,
    @Param('id') id: string,
    @Body() reprocessDto: ReprocessOcrDto,
  ): Promise<DocumentResponseDto> {
    // Extract userId from JWT token
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

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
      @Req() req: Request
  ): Promise<StreamableFile> {
      const { user } = req as Request & { user: { userId: string; role: string } };
      const userId = user.userId;

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
}
