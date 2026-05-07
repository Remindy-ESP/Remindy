import { Test, TestingModule } from '@nestjs/testing';
import { InitializeDefaultFoldersUseCase } from './initialize-default-folders.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';

describe('InitializeDefaultFoldersUseCase', () => {
  let useCase: InitializeDefaultFoldersUseCase;
  let repository: jest.Mocked<IFolderRepository>;

  const makeFolder = (name: string) =>
    new Folder({ id: `id-${name}`, userId: 'user-1', name, isDefault: true });

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IFolderRepository>> = {
      findDefaultFoldersByUserId: jest.fn(),
      findByNameAndUserId: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitializeDefaultFoldersUseCase,
        { provide: FOLDER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<InitializeDefaultFoldersUseCase>(InitializeDefaultFoldersUseCase);
    repository = module.get(FOLDER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return existing default folders without creating new ones', async () => {
    const existingFolders = [makeFolder('Factures'), makeFolder('Contrats')];
    repository.findDefaultFoldersByUserId.mockResolvedValue(existingFolders);

    const result = await useCase.execute('user-1');

    expect(result).toEqual(existingFolders);
    expect(repository.findByNameAndUserId).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should create all default folders when none exist', async () => {
    repository.findDefaultFoldersByUserId.mockResolvedValue([]);
    repository.findByNameAndUserId.mockResolvedValue(null);
    repository.save
      .mockResolvedValueOnce(makeFolder('Factures'))
      .mockResolvedValueOnce(makeFolder('Contrats'))
      .mockResolvedValueOnce(makeFolder('Documents administratifs'));

    const result = await useCase.execute('user-1');

    expect(repository.save).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
  });

  it('should skip creation for folders that already exist by name', async () => {
    const existingFactures = makeFolder('Factures');

    repository.findDefaultFoldersByUserId.mockResolvedValue([]);
    repository.findByNameAndUserId
      .mockResolvedValueOnce(existingFactures) // 'Factures' already exists
      .mockResolvedValueOnce(null)             // 'Contrats' does not exist
      .mockResolvedValueOnce(null);            // 'Documents administratifs' does not exist

    repository.save
      .mockResolvedValueOnce(makeFolder('Contrats'))
      .mockResolvedValueOnce(makeFolder('Documents administratifs'));

    const result = await useCase.execute('user-1');

    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(3); // existing + 2 newly created
  });

  it('should re-throw errors from the repository', async () => {
    const error = new Error('DB failure');
    repository.findDefaultFoldersByUserId.mockRejectedValue(error);

    await expect(useCase.execute('user-1')).rejects.toThrow('DB failure');
  });

  it('getDefaultFolderNames() should return the three default names', () => {
    const names = useCase.getDefaultFolderNames();
    expect(names).toEqual(['Factures', 'Contrats', 'Documents administratifs']);
  });
});
