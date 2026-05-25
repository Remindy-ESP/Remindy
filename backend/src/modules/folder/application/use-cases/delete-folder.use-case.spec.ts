import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteFolderUseCase } from './delete-folder.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';

describe('DeleteFolderUseCase', () => {
  let useCase: DeleteFolderUseCase;
  let repository: jest.Mocked<IFolderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IFolderRepository>> = {
      findById: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findSubfolders: jest.fn(),
      countDocumentsInFolder: jest.fn(),
      moveDocumentsToFolder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteFolderUseCase, { provide: FOLDER_REPOSITORY, useValue: mockRepository }],
    }).compile();

    useCase = module.get<DeleteFolderUseCase>(DeleteFolderUseCase);
    repository = module.get(FOLDER_REPOSITORY);
  });

  it('should delete an empty folder successfully', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.findSubfolders.mockResolvedValue([]);
    repository.countDocumentsInFolder.mockResolvedValue(0);
    repository.save.mockResolvedValue(folder);

    await useCase.execute('folder-123', 'user-123');

    expect(repository.findById).toHaveBeenCalledWith('folder-123');
    expect(repository.findSubfolders).toHaveBeenCalledWith('folder-123');
    expect(repository.countDocumentsInFolder).toHaveBeenCalledWith('folder-123');
    expect(repository.softDelete).toHaveBeenCalledWith('folder-123');
  });

  it('should throw NotFoundException if folder does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent-id', 'user-123')).rejects.toThrow(NotFoundException);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if user does not own folder', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'other-user',
      name: 'Test Folder',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);

    await expect(useCase.execute('folder-123', 'user-123')).rejects.toThrow(ForbiddenException);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if trying to delete default folder', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Default Folder',
      isDefault: true,
    });

    repository.findById.mockResolvedValue(folder);

    await expect(useCase.execute('folder-123', 'user-123')).rejects.toThrow(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should move subfolders to parent before deletion', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      parentId: 'parent-123',
      isDefault: false,
    });

    const subfolder1 = new Folder({
      id: 'sub-1',
      userId: 'user-123',
      name: 'Subfolder 1',
      parentId: 'folder-123',
      isDefault: false,
    });

    const subfolder2 = new Folder({
      id: 'sub-2',
      userId: 'user-123',
      name: 'Subfolder 2',
      parentId: 'folder-123',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.findSubfolders.mockResolvedValue([subfolder1, subfolder2]);
    repository.countDocumentsInFolder.mockResolvedValue(0);
    repository.save.mockResolvedValue(folder);

    await useCase.execute('folder-123', 'user-123');

    expect(repository.findSubfolders).toHaveBeenCalledWith('folder-123');
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(repository.softDelete).toHaveBeenCalledWith('folder-123');
  });

  it('should move documents to parent before deletion', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      parentId: 'parent-123',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.findSubfolders.mockResolvedValue([]);
    repository.countDocumentsInFolder.mockResolvedValue(5);
    repository.moveDocumentsToFolder.mockResolvedValue(undefined);
    repository.save.mockResolvedValue(folder);

    await useCase.execute('folder-123', 'user-123');

    expect(repository.moveDocumentsToFolder).toHaveBeenCalledWith('folder-123', 'parent-123');
    expect(repository.softDelete).toHaveBeenCalledWith('folder-123');
  });

  it('should move documents to root if folder has no parent', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Root Folder',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.findSubfolders.mockResolvedValue([]);
    repository.countDocumentsInFolder.mockResolvedValue(3);
    repository.moveDocumentsToFolder.mockResolvedValue(undefined);
    repository.save.mockResolvedValue(folder);

    await useCase.execute('folder-123', 'user-123');

    expect(repository.moveDocumentsToFolder).toHaveBeenCalledWith('folder-123', null);
    expect(repository.softDelete).toHaveBeenCalledWith('folder-123');
  });
});
