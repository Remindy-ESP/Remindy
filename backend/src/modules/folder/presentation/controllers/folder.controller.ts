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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderResponseDto,
  FolderFilterDto,
  MoveDocumentDto,
} from '../dto/folder.dto';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { FindAllFoldersUseCase } from '../../application/use-cases/find-all-folders.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { MoveDocumentToFolderUseCase } from '../../application/use-cases/move-document-to-folder.use-case';
import { FolderPresentationMapper } from '../mappers/folder-presentation.mapper';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class FolderController {
  constructor(
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly findAllFoldersUseCase: FindAllFoldersUseCase,
    private readonly updateFolderUseCase: UpdateFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
    private readonly moveDocumentToFolderUseCase: MoveDocumentToFolderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau dossier' })
  @ApiResponse({
    status: 201,
    description: 'Dossier créé avec succès',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Un dossier avec ce nom existe déjà' })
  async create(
    @Body() createDto: CreateFolderDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto> {
    const appDto = FolderPresentationMapper.toCreateAppDto(userId, createDto);
    const folder = await this.createFolderUseCase.execute(appDto);

    return FolderPresentationMapper.toResponseDto(folder);
  }

  @Get()
  @ApiOperation({ summary: "Récupérer tous les dossiers de l'utilisateur" })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Filtrer par dossier parent (récupérer les sous-dossiers)',
  })
  @ApiQuery({
    name: 'isDefault',
    required: false,
    description: 'Filtrer par dossiers par défaut uniquement',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: 'Inclure les dossiers supprimés',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers',
    type: [FolderResponseDto],
  })
  async findAll(
    @Query() filters: FolderFilterDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto[]> {
    const appFilters = FolderPresentationMapper.toFilterAppDto(userId, filters);
    const folders = await this.findAllFoldersUseCase.execute(appFilters);

    return FolderPresentationMapper.toResponseDtoArray(folders);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un dossier (renommer, changer couleur, déplacer)' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Dossier mis à jour avec succès',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFolderDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto> {
    const appDto = FolderPresentationMapper.toUpdateAppDto(updateDto);
    const folder = await this.updateFolderUseCase.execute(id, userId, appDto);

    return FolderPresentationMapper.toResponseDto(folder);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un dossier (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 204, description: 'Dossier supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  @ApiResponse({
    status: 400,
    description: 'Le dossier contient des documents ou des sous-dossiers',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.deleteFolderUseCase.execute(id, userId);
  }

  @Post(':id/documents/:docId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déplacer un document dans un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier de destination' })
  @ApiParam({ name: 'docId', description: 'ID du document à déplacer' })
  @ApiResponse({
    status: 200,
    description: 'Document déplacé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Dossier ou document non trouvé' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async moveDocument(
    @Param('id') folderId: string,
    @Param('docId') documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    const appDto = FolderPresentationMapper.toMoveDocumentAppDto(userId, folderId, documentId);

    await this.moveDocumentToFolderUseCase.execute(appDto);

    return {
      message: `Document ${documentId} successfully moved to folder ${folderId}`,
    };
  }
}
