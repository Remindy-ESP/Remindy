import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/common';
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

@ApiTags('Documents')
@Controller('documents')
@UseGuards(ThrottlerGuard)
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly findAllDocumentsUseCase: FindAllDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly reprocessOcrUseCase: ReprocessOcrUseCase,
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
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

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
  async findAll(@Query() filters: DocumentFilterDto): Promise<DocumentResponseDto[]> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

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
  async delete(@Param('id') id: string): Promise<void> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

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
  ): Promise<DocumentResponseDto> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const appDto = DocumentPresentationMapper.toReprocessOcrAppDto(reprocessDto);
    const document = await this.reprocessOcrUseCase.execute(id, userId, appDto);
    return DocumentPresentationMapper.toResponseDto(document);
  }
}
