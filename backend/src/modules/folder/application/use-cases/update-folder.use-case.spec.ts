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
      providers: [UpdateFolderUseCase, { provide: FOLDER_REPOSITORY, useValue: mockRepository }],
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

    await expect(useCase.execute('nonexistent-id', 'user-123', dto)).rejects.toThrow(
      NotFoundException,
    );
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

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(
      ForbiddenException,
    );
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

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(
      ForbiddenException,
    );
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

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(
      ForbiddenException,
    );
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
      .mockResolvedValueOnce(folderA)
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

    repository.findById.mockResolvedValueOnce(folderB).mockResolvedValueOnce(folderA);
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

  it('should throw NotFoundException when parentId is given but parent folder does not exist', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      isDefault: false,
    });

    // First call: findById for the folder itself
    // Second call: findById for the parent (returns null)
    repository.findById.mockResolvedValueOnce(folder).mockResolvedValueOnce(null);

    const dto: UpdateFolderAppDto = {
      parentId: 'non-existent-parent',
    };

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when parent folder belongs to a different user', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      isDefault: false,
    });

    const otherUserParent = new Folder({
      id: 'parent-999',
      userId: 'other-user',
      name: 'Other User Folder',
      isDefault: false,
    });

    repository.findById
      .mockResolvedValueOnce(folder)        // folder itself
      .mockResolvedValueOnce(otherUserParent); // parent

    const dto: UpdateFolderAppDto = {
      parentId: 'parent-999',
    };

    await expect(useCase.execute('folder-123', 'user-123', dto)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should not touch parentId when dto.parentId is omitted', async () => {
    const folder = new Folder({
      id: 'folder-123',
      userId: 'user-123',
      name: 'Test Folder',
      parentId: 'some-parent',
      isDefault: false,
    });

    repository.findById.mockResolvedValue(folder);
    repository.save.mockResolvedValue(folder);

    // parentId not present in dto → the block `if (dto.parentId !== undefined)` is skipped
    const dto: UpdateFolderAppDto = {};

    await useCase.execute('folder-123', 'user-123', dto);

    // parentId is unchanged because the move branch was never entered
    expect(folder.parentId).toBe('some-parent');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should detect circular hierarchy via visitedIds guard (existing loop in DB)', async () => {
    // folder-b wants its parent to be folder-a
    // but folder-a → folder-b → folder-a creates an existing loop (visitedIds path)
    const folderB = new Folder({
      id: 'folder-b',
      userId: 'user-123',
      name: 'Folder B',
      isDefault: false,
    });

    const folderA = new Folder({
      id: 'folder-a',
      userId: 'user-123',
      name: 'Folder A',
      parentId: 'folder-b', // A's parent is B
      isDefault: false,
    });

    // When walking up from folder-a: parentId = folder-b, then folder-b's parent = folder-a again → loop
    const folderBAgain = new Folder({
      id: 'folder-b',
      userId: 'user-123',
      name: 'Folder B',
      parentId: 'folder-a', // creates the loop
      isDefault: false,
    });

    repository.findById
      .mockResolvedValueOnce(folderB)    // fetch the folder being updated
      .mockResolvedValueOnce(folderA)    // fetch new parent (folder-a)
      .mockResolvedValueOnce(folderBAgain) // walk: folder-a's parent → folder-b (again, loop!)
      .mockResolvedValueOnce(folderA);   // walk: folder-b's parent → folder-a (already visited)

    const dto: UpdateFolderAppDto = { parentId: 'folder-a' };

    await expect(useCase.execute('folder-b', 'user-123', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when hierarchy is deeper than maxDepth', async () => {
    // Build a chain of folders that is exactly maxDepth + 1 deep
    const MAX_DEPTH = 100;

    const targetFolder = new Folder({
      id: 'folder-target',
      userId: 'user-123',
      name: 'Target',
      isDefault: false,
    });

    // The proposed new parent is folder-0; from there we will traverse MAX_DEPTH levels
    // without ever hitting folder-target, so depth >= maxDepth throws
    let callCount = 0;

    repository.findById.mockImplementation(async (id: string) => {
      if (callCount === 0) {
        callCount++;
        return targetFolder; // fetch the folder itself
      }
      if (callCount === 1) {
        callCount++;
        // fetch the proposed parent
        return new Folder({ id: 'folder-0', userId: 'user-123', name: 'Chain 0', isDefault: false, parentId: 'folder-1' });
      }
      // Walk up: each folder's parent is folder-{callCount}
      const depth = callCount;
      callCount++;
      const parentId = depth < MAX_DEPTH + 2 ? `folder-${depth}` : undefined;
      return new Folder({
        id: `folder-${depth - 1}`,
        userId: 'user-123',
        name: `Chain ${depth - 1}`,
        isDefault: false,
        parentId,
      });
    });

    const dto: UpdateFolderAppDto = { parentId: 'folder-0' };

    await expect(useCase.execute('folder-target', 'user-123', dto)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
