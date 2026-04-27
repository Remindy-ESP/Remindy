import { Controller, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderResponseDto,
  FolderFilterDto,
} from '../dto/folder.dto';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { FindAllFoldersUseCase } from '../../application/use-cases/find-all-folders.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { MoveDocumentToFolderUseCase } from '../../application/use-cases/move-document-to-folder.use-case';
import { FolderPresentationMapper } from '../mappers/folder-presentation.mapper';
import { FOLDER_REPOSITORY } from '../../application/ports/folder-repository.interface';
import type { IFolderRepository } from '../../application/ports/folder-repository.interface';
import {
  ApiFolderCreate,
  ApiFolderFindAll,
  ApiFolderUpdate,
  ApiFolderDelete,
  ApiFolderMoveDocument,
} from '../../../../swagger/decorators/api-folder.decorator';

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
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  @ApiFolderCreate()
  async create(
    @Body() createDto: CreateFolderDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto> {
    const appDto = FolderPresentationMapper.toCreateAppDto(userId, createDto);
    const folder = await this.createFolderUseCase.execute(appDto);

    return FolderPresentationMapper.toResponseDto(folder);
  }

  @ApiFolderFindAll()
  async findAll(
    @Query() filters: FolderFilterDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto[]> {
    const appFilters = FolderPresentationMapper.toFilterAppDto(userId, filters);
    const folders = await this.findAllFoldersUseCase.execute(appFilters);

    const documentCounts = new Map<string, number>();
    await Promise.all(
      folders.map(async folder => {
        if (folder.id) {
          const count = await this.folderRepository.countDocumentsInFolder(folder.id);
          documentCounts.set(folder.id, count);
        }
      }),
    );

    return FolderPresentationMapper.toResponseDtoArray(folders, documentCounts);
  }

  @ApiFolderUpdate()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFolderDto,
    @CurrentUser('id') userId: string,
  ): Promise<FolderResponseDto> {
    const appDto = FolderPresentationMapper.toUpdateAppDto(updateDto);
    const folder = await this.updateFolderUseCase.execute(id, userId, appDto);

    return FolderPresentationMapper.toResponseDto(folder);
  }

  @ApiFolderDelete()
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<void> {
    await this.deleteFolderUseCase.execute(id, userId);
  }

  @ApiFolderMoveDocument()
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
