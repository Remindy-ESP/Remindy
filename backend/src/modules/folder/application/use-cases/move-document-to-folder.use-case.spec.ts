import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MoveDocumentToFolderUseCase } from './move-document-to-folder.use-case';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import type { IDocumentRepository } from '../../../document/application/ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../../../document/application/ports/document-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { Document } from '../../../document/domain/document.entity';
import { MoveDocumentToFolderAppDto } from '../dto/folder-app.dto';

const makeDocument = (overrides: Partial<{ userId: string; folderId: string; deletedAt: Date }> = {}) => {
  const doc = new Document({
    id: 'doc-1',
    userId: overrides.userId ?? 'user-1',
    filename: 'file.pdf',
    r2Key: 'key/file.pdf',
    r2Bucket: 'my-bucket',
    fileHash: 'hash123',
    fileSize: 1024,
    mimeType: 'application/pdf',
    ocrStatus: 'pending',
    folderId: overrides.folderId,
  });
  return doc;
};

const makeFolder = (overrides: Partial<{ userId: string; deletedAt: Date }> = {}) =>
  new Folder({
    id: 'folder-1',
    userId: overrides.userId ?? 'user-1',
    name: 'My Folder',
    deletedAt: overrides.deletedAt,
  });

describe('MoveDocumentToFolderUseCase', () => {
  let useCase: MoveDocumentToFolderUseCase;
  let folderRepo: jest.Mocked<IFolderRepository>;
  let documentRepo: jest.Mocked<IDocumentRepository>;

  const baseDto: MoveDocumentToFolderAppDto = {
    documentId: 'doc-1',
    folderId: 'folder-1',
    userId: 'user-1',
  };

  beforeEach(async () => {
    const mockFolderRepo: Partial<jest.Mocked<IFolderRepository>> = {
      findById: jest.fn(),
    };
    const mockDocumentRepo: Partial<jest.Mocked<IDocumentRepository>> = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveDocumentToFolderUseCase,
        { provide: FOLDER_REPOSITORY, useValue: mockFolderRepo },
        { provide: DOCUMENT_REPOSITORY, useValue: mockDocumentRepo },
      ],
    }).compile();

    useCase = module.get<MoveDocumentToFolderUseCase>(MoveDocumentToFolderUseCase);
    folderRepo = module.get(FOLDER_REPOSITORY);
    documentRepo = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should move document to folder successfully', async () => {
    const doc = makeDocument({ folderId: 'other-folder' });
    const folder = makeFolder();

    documentRepo.findById.mockResolvedValue(doc);
    folderRepo.findById.mockResolvedValue(folder);
    documentRepo.save.mockResolvedValue(doc);

    await expect(useCase.execute(baseDto)).resolves.toBeUndefined();
    expect(documentRepo.save).toHaveBeenCalledWith(doc);
  });

  it('should throw NotFoundException when document does not exist', async () => {
    documentRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseDto)).rejects.toThrow(NotFoundException);
    expect(folderRepo.findById).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when document belongs to another user', async () => {
    const doc = makeDocument({ userId: 'other-user' });
    documentRepo.findById.mockResolvedValue(doc);

    await expect(useCase.execute(baseDto)).rejects.toThrow(ForbiddenException);
    expect(folderRepo.findById).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when folder does not exist', async () => {
    const doc = makeDocument();
    documentRepo.findById.mockResolvedValue(doc);
    folderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseDto)).rejects.toThrow(NotFoundException);
    expect(documentRepo.save).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when folder belongs to another user', async () => {
    const doc = makeDocument();
    const folder = makeFolder({ userId: 'other-user' });

    documentRepo.findById.mockResolvedValue(doc);
    folderRepo.findById.mockResolvedValue(folder);

    await expect(useCase.execute(baseDto)).rejects.toThrow(ForbiddenException);
    expect(documentRepo.save).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when folder is soft-deleted', async () => {
    const doc = makeDocument();
    const folder = makeFolder({ deletedAt: new Date() });

    documentRepo.findById.mockResolvedValue(doc);
    folderRepo.findById.mockResolvedValue(folder);

    await expect(useCase.execute(baseDto)).rejects.toThrow(BadRequestException);
    expect(documentRepo.save).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when document is already in the target folder', async () => {
    const doc = makeDocument({ folderId: 'folder-1' }); // same as dto.folderId
    const folder = makeFolder();

    documentRepo.findById.mockResolvedValue(doc);
    folderRepo.findById.mockResolvedValue(folder);

    await expect(useCase.execute(baseDto)).rejects.toThrow(BadRequestException);
    expect(documentRepo.save).not.toHaveBeenCalled();
  });
});
