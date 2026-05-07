import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FolderController } from './folder.controller';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { FindAllFoldersUseCase } from '../../application/use-cases/find-all-folders.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { MoveDocumentToFolderUseCase } from '../../application/use-cases/move-document-to-folder.use-case';
import { FOLDER_REPOSITORY } from '../../application/ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { CreateFolderDto, UpdateFolderDto, FolderFilterDto } from '../dto/folder.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

const makeFolder = (overrides: Partial<{
  id: string;
  userId: string;
  name: string;
}> = {}): Folder =>
  new Folder({
    id: overrides.id ?? 'folder-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Bills',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  });

describe('FolderController', () => {
  let controller: FolderController;
  let createFolderUseCase: jest.Mocked<CreateFolderUseCase>;
  let findAllFoldersUseCase: jest.Mocked<FindAllFoldersUseCase>;
  let updateFolderUseCase: jest.Mocked<UpdateFolderUseCase>;
  let deleteFolderUseCase: jest.Mocked<DeleteFolderUseCase>;
  let moveDocumentToFolderUseCase: jest.Mocked<MoveDocumentToFolderUseCase>;
  let mockFolderRepository: { countDocumentsInFolder: jest.Mock };

  const userId = 'user-1';

  beforeEach(async () => {
    mockFolderRepository = { countDocumentsInFolder: jest.fn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [
        { provide: CreateFolderUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllFoldersUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateFolderUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteFolderUseCase, useValue: { execute: jest.fn() } },
        { provide: MoveDocumentToFolderUseCase, useValue: { execute: jest.fn() } },
        { provide: FOLDER_REPOSITORY, useValue: mockFolderRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FolderController>(FolderController);
    createFolderUseCase = module.get(CreateFolderUseCase);
    findAllFoldersUseCase = module.get(FindAllFoldersUseCase);
    updateFolderUseCase = module.get(UpdateFolderUseCase);
    deleteFolderUseCase = module.get(DeleteFolderUseCase);
    moveDocumentToFolderUseCase = module.get(MoveDocumentToFolderUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should create and return a folder response DTO', async () => {
      const createDto: CreateFolderDto = { name: 'Bills' };
      const folder = makeFolder();
      (createFolderUseCase.execute as jest.Mock).mockResolvedValue(folder);

      const result = await controller.create(createDto, userId);

      expect(createFolderUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', name: 'Bills' }),
      );
      expect(result.id).toBe('folder-1');
      expect(result.name).toBe('Bills');
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return a list of folder response DTOs with document counts', async () => {
      const filters: FolderFilterDto = {};
      const folder1 = makeFolder({ id: 'f-1' });
      const folder2 = makeFolder({ id: 'f-2', name: 'Contrats' });
      (findAllFoldersUseCase.execute as jest.Mock).mockResolvedValue([folder1, folder2]);
      mockFolderRepository.countDocumentsInFolder
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0);

      const result = await controller.findAll(filters, userId);

      expect(findAllFoldersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
      expect(result).toHaveLength(2);
      expect(mockFolderRepository.countDocumentsInFolder).toHaveBeenCalledTimes(2);
    });

    it('should handle folders without id in findAll gracefully', async () => {
      // A folder with no id should just be skipped in the counts map
      const noIdFolder = new Folder({ userId: 'user-1', name: 'No ID' });
      (findAllFoldersUseCase.execute as jest.Mock).mockResolvedValue([noIdFolder]);

      const result = await controller.findAll({}, userId);

      // countDocumentsInFolder should NOT be called since there is no id
      expect(mockFolderRepository.countDocumentsInFolder).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update and return the updated folder DTO', async () => {
      const updateDto: UpdateFolderDto = { name: 'New Name' };
      const updated = makeFolder({ name: 'New Name' });
      (updateFolderUseCase.execute as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update('folder-1', updateDto, userId);

      expect(updateFolderUseCase.execute).toHaveBeenCalledWith(
        'folder-1',
        userId,
        expect.objectContaining({ name: 'New Name' }),
      );
      expect(result.name).toBe('New Name');
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should delegate to DeleteFolderUseCase', async () => {
      (deleteFolderUseCase.execute as jest.Mock).mockResolvedValue(undefined);

      await expect(controller.delete('folder-1', userId)).resolves.toBeUndefined();
      expect(deleteFolderUseCase.execute).toHaveBeenCalledWith('folder-1', userId);
    });
  });

  // ── moveDocument ──────────────────────────────────────────────────────────

  describe('moveDocument()', () => {
    it('should move a document and return a success message', async () => {
      (moveDocumentToFolderUseCase.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.moveDocument('folder-1', 'doc-1', userId);

      expect(moveDocumentToFolderUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          folderId: 'folder-1',
          documentId: 'doc-1',
        }),
      );
      expect(result.message).toContain('doc-1');
      expect(result.message).toContain('folder-1');
    });
  });
});
