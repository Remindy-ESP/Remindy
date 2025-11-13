import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderEntity } from './infrastructure/persistence/folder.entity';
import { FolderRepository } from './infrastructure/persistence/folder.repository';
import { FolderController } from './presentation/controllers/folder.controller';
import { FOLDER_REPOSITORY } from './application/ports/folder-repository.interface';
import { CreateFolderUseCase } from './application/use-cases/create-folder.use-case';
import { FindAllFoldersUseCase } from './application/use-cases/find-all-folders.use-case';
import { UpdateFolderUseCase } from './application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from './application/use-cases/delete-folder.use-case';
import { MoveDocumentToFolderUseCase } from './application/use-cases/move-document-to-folder.use-case';
import { InitializeDefaultFoldersUseCase } from './application/use-cases/initialize-default-folders.use-case';
import { DocumentModule } from '../document/document.module';

/**
 * Folder Module
 * Gère les dossiers pour organiser les documents
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([FolderEntity]),
    DocumentModule, // Pour accéder au DocumentRepository
  ],
  controllers: [FolderController],
  providers: [
    // Repository
    {
      provide: FOLDER_REPOSITORY,
      useClass: FolderRepository,
    },

    // Use Cases
    CreateFolderUseCase,
    FindAllFoldersUseCase,
    UpdateFolderUseCase,
    DeleteFolderUseCase,
    MoveDocumentToFolderUseCase,
    InitializeDefaultFoldersUseCase,
  ],
  exports: [
    FOLDER_REPOSITORY,
    InitializeDefaultFoldersUseCase,
    TypeOrmModule,
  ],
})
export class FolderModule {}
