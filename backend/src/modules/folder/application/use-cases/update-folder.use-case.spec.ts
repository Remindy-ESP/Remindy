import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateFolderUseCase } from './update-folder.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { UpdateFolderAppDto } from '../dto/folder-app.dto';

describe('UpdateFolderUseCase', () => {
  let useCase: UpdateFolderUseCase;
  let repository: jest.Mocked<IFolderRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IFolderRepository>> = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateFolderUseCase,
        { provide: FOLDER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<UpdateFolderUseCase>(UpdateFolderUseCase);
    repository = module.get(FOLDER_REPOSITORY);
  });

  it('should update folder name successfully', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Old Name',
      isDefault: false,
    });

    const dto: UpdateFolderAppDto = {
      name: 'New Name',
    };

    repository.findById.mockResolvedValue(folder);
    repository.save.mockResolvedValue(folder);

    await useCase.execute('folder-123', 'user-123', dto);

    expect(repository.findById).toHaveBeenCalledWith('folder-123');
    expect(repository.save).toHaveBeenCalled();
    expect(folder.name).toBe('New Name');
  });

  it('should throw NotFoundException if folder does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const dto: UpdateFolderAppDto = { name: 'New Name' };

    await expect(useCase.execute('nonexistent-id', 'user-123', dto)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user does not own folder', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'other-user',
      name: 'Test',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);

    const dto: UpdateFolderAppDto = { name: 'New Name' };

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when renaming default folder', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Default Folder',
      isDefault: true,
    });

    repository.findById.mockResolvedValue(folder);

    const dto: UpdateFolderAppDto = { name: 'New Name' };

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if folder tries to be its own parent', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);

    const dto: UpdateFolderAppDto = {
      parentId: 'folder-123',
    };

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should prevent circular hierarchy A->B->A', async () => {
    const folderA = new Folder({
      id: 'folder-a',
      userId: 'user-123',
      name: 'Folder A',
      parentId: 'folder-b',
      isDefault: false,
    });

    const folderB = new Folder({
      id: 'folder-b',
      userId: 'user-123',
      name: 'Folder B',
      isDefault: false,
    });

    repository.findById
      .mockResolvedValueOnce(folderB)
      .mockResolvedValueOnce(folderA);

    const dto: UpdateFolderAppDto = {
      parentId: 'folder-a',
    };

    await expect(useCase.execute('folder-b', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should prevent circular hierarchy A->B->C->A', async () => {
    const folderA = new Folder({
      id: 'folder-a',
      userId: 'user-123',
      name: 'Folder A',
      isDefault: false,
    });

    const folderB = new Folder({
      id: 'folder-b',
      userId: 'user-123',
      name: 'Folder B',
      parentId: 'folder-a',
      isDefault: false,
    });

    const folderC = new Folder({
      id: 'folder-c',
      userId: 'user-123',
      name: 'Folder C',
      parentId: 'folder-b',
      isDefault: false,
    });

    repository.findById
      .mockResolvedValueOnce(folderC)
      .mockResolvedValueOnce(folderC)
      .mockResolvedValueOnce(folderB)
      .mockResolvedValueOnce(folderA);

    const dto: UpdateFolderAppDto = {
      parentId: 'folder-c',
    };

    await expect(useCase.execute('folder-a', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should allow valid parent change', async () => {
    const folderA = new Folder({
      id: 'folder-a',
      userId: 'user-123',
      name: 'Folder A',
      isDefault: false,
    });

    const folderB = new Folder({
      id: 'folder-b',
      userId: 'user-123',
      name: 'Folder B',
      isDefault: false,
    });

    repository.findById
      .mockResolvedValueOnce(folderB)
      .mockResolvedValueOnce(folderA);
    repository.save.mockResolvedValue(folderB);

    const dto: UpdateFolderAppDto = {
      parentId: 'folder-a',
    };

    await useCase.execute('folder-b', 'user-123', dto);

    expect(repository.save).toHaveBeenCalled();
  });

  it('should update color and icon', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.save.mockResolvedValue(folder);

    const dto: UpdateFolderAppDto = {
      color: '#FF0000',
      icon: 'folder-icon',
    };

    await useCase.execute('folder-123', 'user-123', dto);

    expect(folder.color).toBe('#FF0000');
    expect(folder.icon).toBe('folder-icon');
    expect(repository.save).toHaveBeenCalled();
  });
});
