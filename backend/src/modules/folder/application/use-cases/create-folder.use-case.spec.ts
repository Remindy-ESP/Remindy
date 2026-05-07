import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateFolderUseCase } from './create-folder.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { CreateFolderAppDto } from '../dto/folder-app.dto';

describe('CreateFolderUseCase', () => {
  let useCase: CreateFolderUseCase;
  let repository: jest.Mocked<IFolderRepository>;

  const savedFolder = new Folder({ id: 'folder-1', userId: 'user-1', name: 'Bills' });

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IFolderRepository>> = {
      findByNameAndUserId: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateFolderUseCase, { provide: FOLDER_REPOSITORY, useValue: mockRepository }],
    }).compile();

    useCase = module.get<CreateFolderUseCase>(CreateFolderUseCase);
    repository = module.get(FOLDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create and return a folder without parent', async () => {
    const dto: CreateFolderAppDto = {
      userId: 'user-1',
      name: 'Bills',
      color: '#3B82F6',
      icon: '📄',
    };

    repository.findByNameAndUserId.mockResolvedValue(null);
    repository.save.mockResolvedValue(savedFolder);

    const result = await useCase.execute(dto);

    expect(repository.findByNameAndUserId).toHaveBeenCalledWith('Bills', 'user-1');
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result).toBe(savedFolder);
  });

  it('should create a folder with a valid parent', async () => {
    const parentFolder = new Folder({ id: 'parent-1', userId: 'user-1', name: 'Parent' });
    const dto: CreateFolderAppDto = {
      userId: 'user-1',
      name: 'Child',
      parentId: 'parent-1',
    };

    repository.findByNameAndUserId.mockResolvedValue(null);
    repository.findById.mockResolvedValue(parentFolder);
    repository.save.mockResolvedValue(savedFolder);

    const result = await useCase.execute(dto);

    expect(repository.findById).toHaveBeenCalledWith('parent-1');
    expect(result).toBe(savedFolder);
  });

  it('should throw ConflictException when a folder with the same name already exists', async () => {
    const dto: CreateFolderAppDto = { userId: 'user-1', name: 'Bills' };
    repository.findByNameAndUserId.mockResolvedValue(savedFolder);

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when parentId is set but parent does not exist', async () => {
    const dto: CreateFolderAppDto = {
      userId: 'user-1',
      name: 'Child',
      parentId: 'non-existent',
    };

    repository.findByNameAndUserId.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when parent belongs to a different user', async () => {
    const otherUserParent = new Folder({ id: 'parent-1', userId: 'other-user', name: 'Parent' });
    const dto: CreateFolderAppDto = {
      userId: 'user-1',
      name: 'Child',
      parentId: 'parent-1',
    };

    repository.findByNameAndUserId.mockResolvedValue(null);
    repository.findById.mockResolvedValue(otherUserParent);

    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
