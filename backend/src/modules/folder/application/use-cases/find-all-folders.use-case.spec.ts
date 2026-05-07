import { Test, TestingModule } from '@nestjs/testing';
import { FindAllFoldersUseCase } from './find-all-folders.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { FolderFilterAppDto } from '../dto/folder-app.dto';

describe('FindAllFoldersUseCase', () => {
  let useCase: FindAllFoldersUseCase;
  let repository: jest.Mocked<IFolderRepository>;

  const folder1 = new Folder({ id: 'f-1', userId: 'user-1', name: 'Folder 1' });
  const folder2 = new Folder({ id: 'f-2', userId: 'user-1', name: 'Folder 2' });

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IFolderRepository>> = {
      findSubfolders: jest.fn(),
      findDefaultFoldersByUserId: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FindAllFoldersUseCase, { provide: FOLDER_REPOSITORY, useValue: mockRepository }],
    }).compile();

    useCase = module.get<FindAllFoldersUseCase>(FindAllFoldersUseCase);
    repository = module.get(FOLDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return subfolders when parentId is provided', async () => {
    const filters: FolderFilterAppDto = { userId: 'user-1', parentId: 'parent-1' };
    repository.findSubfolders.mockResolvedValue([folder1, folder2]);

    const result = await useCase.execute(filters);

    expect(repository.findSubfolders).toHaveBeenCalledWith('parent-1');
    expect(repository.findDefaultFoldersByUserId).not.toHaveBeenCalled();
    expect(repository.findByUserId).not.toHaveBeenCalled();
    expect(result).toEqual([folder1, folder2]);
  });

  it('should return default folders when isDefault is set', async () => {
    const filters: FolderFilterAppDto = { userId: 'user-1', isDefault: true };
    repository.findDefaultFoldersByUserId.mockResolvedValue([folder1]);

    const result = await useCase.execute(filters);

    expect(repository.findDefaultFoldersByUserId).toHaveBeenCalledWith('user-1');
    expect(repository.findSubfolders).not.toHaveBeenCalled();
    expect(repository.findByUserId).not.toHaveBeenCalled();
    expect(result).toEqual([folder1]);
  });

  it('should return all folders when no specific filter is provided', async () => {
    const filters: FolderFilterAppDto = { userId: 'user-1' };
    repository.findByUserId.mockResolvedValue([folder1, folder2]);

    const result = await useCase.execute(filters);

    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', false);
    expect(result).toEqual([folder1, folder2]);
  });

  it('should pass includeDeleted flag when getting all folders', async () => {
    const filters: FolderFilterAppDto = { userId: 'user-1', includeDeleted: true };
    repository.findByUserId.mockResolvedValue([folder1]);

    const result = await useCase.execute(filters);

    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', true);
    expect(result).toEqual([folder1]);
  });

  it('should default includeDeleted to false when not provided', async () => {
    const filters: FolderFilterAppDto = { userId: 'user-1', includeDeleted: undefined };
    repository.findByUserId.mockResolvedValue([]);

    await useCase.execute(filters);

    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', false);
  });

  it('should use findSubfolders even if isDefault is also set when parentId is provided', async () => {
    // parentId takes priority (checked first)
    const filters: FolderFilterAppDto = { userId: 'user-1', parentId: 'parent-1', isDefault: true };
    repository.findSubfolders.mockResolvedValue([folder1]);

    const result = await useCase.execute(filters);

    expect(repository.findSubfolders).toHaveBeenCalledWith('parent-1');
    expect(repository.findDefaultFoldersByUserId).not.toHaveBeenCalled();
    expect(result).toEqual([folder1]);
  });
});
