import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';

import { FolderController } from '../src/modules/folder/presentation/controllers/folder.controller';
import { CreateFolderUseCase } from '../src/modules/folder/application/use-cases/create-folder.use-case';
import { FindAllFoldersUseCase } from '../src/modules/folder/application/use-cases/find-all-folders.use-case';
import { UpdateFolderUseCase } from '../src/modules/folder/application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../src/modules/folder/application/use-cases/delete-folder.use-case';
import { MoveDocumentToFolderUseCase } from '../src/modules/folder/application/use-cases/move-document-to-folder.use-case';
import { FOLDER_REPOSITORY } from '../src/modules/folder/application/ports/folder-repository.interface';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { Folder } from '../src/modules/folder/domain/folder.entity';

/**
 * Fake JwtAuthGuard that sets req.user without passport/JWT strategy.
 * - "Bearer user-token"  → { id, userId, role: USER_PREMIUM }
 * - any other / missing  → 401
 */
class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers.authorization;
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const [, token] = auth.split(' ');
    if (token === 'user-token') {
      req.user = { id: USER_ID, userId: USER_ID, role: Role.USER_PREMIUM };
      return true;
    }
    throw new UnauthorizedException('Invalid or expired token');
  }
}

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FOLDER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PARENT_FOLDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DOC_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const now = new Date('2026-01-01T12:00:00.000Z');

const makeDomainFolder = (overrides: { id?: string; name?: string; parentId?: string; isDefault?: boolean } = {}): Folder =>
  new Folder({
    id: overrides.id ?? FOLDER_ID,
    userId: USER_ID,
    name: overrides.name ?? 'My Folder',
    parentId: overrides.parentId,
    color: '#3B82F6',
    icon: undefined,
    isDefault: overrides.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  });

describe('Folder Module (e2e)', () => {
  let app: INestApplication;

  const createFolderUseCase = { execute: jest.fn() };
  const findAllFoldersUseCase = { execute: jest.fn() };
  const updateFolderUseCase = { execute: jest.fn() };
  const deleteFolderUseCase = { execute: jest.fn() };
  const moveDocumentToFolderUseCase = { execute: jest.fn() };
  const folderRepository = { countDocumentsInFolder: jest.fn() };
  const authHeader = () => ({ Authorization: 'Bearer user-token' });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [
        { provide: CreateFolderUseCase, useValue: createFolderUseCase },
        { provide: FindAllFoldersUseCase, useValue: findAllFoldersUseCase },
        { provide: UpdateFolderUseCase, useValue: updateFolderUseCase },
        { provide: DeleteFolderUseCase, useValue: deleteFolderUseCase },
        { provide: MoveDocumentToFolderUseCase, useValue: moveDocumentToFolderUseCase },
        { provide: FOLDER_REPOSITORY, useValue: folderRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtAuthGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createFolderUseCase.execute.mockResolvedValue(makeDomainFolder());
    findAllFoldersUseCase.execute.mockResolvedValue([makeDomainFolder()]);
    updateFolderUseCase.execute.mockResolvedValue(makeDomainFolder());
    deleteFolderUseCase.execute.mockResolvedValue(undefined);
    moveDocumentToFolderUseCase.execute.mockResolvedValue(undefined);
    folderRepository.countDocumentsInFolder.mockResolvedValue(3);
  });

  // ─── Authentication ────────────────────────────────────────────────────────

  it('returns 401 when no Authorization header is provided', async () => {
    await request(app.getHttpServer()).get('/folders').expect(401);
  });

  it('returns 401 when token is invalid', async () => {
    await request(app.getHttpServer())
      .get('/folders')
      .set('Authorization', 'Bearer bad-token')
      .expect(401);
  });

  // ─── POST /folders ─────────────────────────────────────────────────────────

  it('creates a folder with a name', async () => {
    const response = await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'My Folder' })
      .expect(201);

    expect(createFolderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        name: 'My Folder',
      }),
    );
    expect(response.body).toMatchObject({
      id: FOLDER_ID,
      userId: USER_ID,
      name: 'My Folder',
    });
  });

  it('creates a subfolder with a parentId', async () => {
    const subfolder = makeDomainFolder({ id: FOLDER_ID, parentId: PARENT_FOLDER_ID });
    createFolderUseCase.execute.mockResolvedValue(subfolder);

    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'Sub Folder', parentId: PARENT_FOLDER_ID })
      .expect(201);

    expect(createFolderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        name: 'Sub Folder',
        parentId: PARENT_FOLDER_ID,
      }),
    );
  });

  it('creates a folder with color and icon', async () => {
    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'Colored Folder', color: '#10B981', icon: 'folder-star' })
      .expect(201);

    expect(createFolderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Colored Folder',
        color: '#10B981',
        icon: 'folder-star',
      }),
    );
  });

  it('returns 400 when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ color: '#3B82F6' })
      .expect(400);
  });

  it('returns 400 when color format is invalid', async () => {
    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'Bad Color', color: 'not-a-hex-color' })
      .expect(400);
  });

  it('returns 400 when name exceeds 255 characters', async () => {
    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'a'.repeat(256) })
      .expect(400);
  });

  it('returns 400 for unknown fields in create request', async () => {
    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'Folder', unknownField: 'value' })
      .expect(400);
  });

  it('propagates errors from create use case', async () => {
    createFolderUseCase.execute.mockRejectedValue(new Error('Folder name already in use'));

    await request(app.getHttpServer())
      .post('/folders')
      .set(authHeader())
      .send({ name: 'Duplicate Folder' })
      .expect(500);
  });

  // ─── GET /folders ──────────────────────────────────────────────────────────

  it('returns all folders for the authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .expect(200);

    expect(findAllFoldersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({ id: FOLDER_ID, userId: USER_ID });
  });

  it('includes documentCount from repository in response', async () => {
    folderRepository.countDocumentsInFolder.mockResolvedValue(7);

    const response = await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .expect(200);

    expect(folderRepository.countDocumentsInFolder).toHaveBeenCalledWith(FOLDER_ID);
    expect(response.body[0].documentCount).toBe(7);
  });

  it('filters folders by parentId', async () => {
    findAllFoldersUseCase.execute.mockResolvedValue([
      makeDomainFolder({ parentId: PARENT_FOLDER_ID }),
    ]);

    await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .query({ parentId: PARENT_FOLDER_ID })
      .expect(200);

    expect(findAllFoldersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        parentId: PARENT_FOLDER_ID,
      }),
    );
  });

  it('returns 400 for invalid parentId format in query', async () => {
    await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .query({ parentId: 'not-a-uuid' })
      .expect(400);
  });

  it('returns 400 for unknown query params', async () => {
    await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .query({ unknownParam: 'value' })
      .expect(400);
  });

  it('returns empty array when user has no folders', async () => {
    findAllFoldersUseCase.execute.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/folders')
      .set(authHeader())
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // ─── PUT /folders/:id ──────────────────────────────────────────────────────

  it('updates a folder name', async () => {
    const updated = makeDomainFolder({ name: 'Renamed Folder' });
    updateFolderUseCase.execute.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ name: 'Renamed Folder' })
      .expect(200);

    expect(updateFolderUseCase.execute).toHaveBeenCalledWith(
      FOLDER_ID,
      USER_ID,
      expect.objectContaining({ name: 'Renamed Folder' }),
    );
    expect(response.body.name).toBe('Renamed Folder');
  });

  it('updates a folder color', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ color: '#FF5722' })
      .expect(200);

    expect(updateFolderUseCase.execute).toHaveBeenCalledWith(
      FOLDER_ID,
      USER_ID,
      expect.objectContaining({ color: '#FF5722' }),
    );
  });

  it('updates a folder icon', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ icon: 'star' })
      .expect(200);

    expect(updateFolderUseCase.execute).toHaveBeenCalledWith(
      FOLDER_ID,
      USER_ID,
      expect.objectContaining({ icon: 'star' }),
    );
  });

  it('moves a folder to a new parent', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ parentId: PARENT_FOLDER_ID })
      .expect(200);

    expect(updateFolderUseCase.execute).toHaveBeenCalledWith(
      FOLDER_ID,
      USER_ID,
      expect.objectContaining({ parentId: PARENT_FOLDER_ID }),
    );
  });

  it('returns 400 for invalid color format in update', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ color: 'invalidcolor' })
      .expect(400);
  });

  it('returns 400 for icon exceeding 50 characters', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ icon: 'i'.repeat(51) })
      .expect(400);
  });

  it('returns 400 for unknown fields in update', async () => {
    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ unknownField: 'value' })
      .expect(400);
  });

  it('propagates NotFoundException from update use case', async () => {
    updateFolderUseCase.execute.mockRejectedValue(
      new NotFoundException(`Folder ${FOLDER_ID} not found`),
    );

    await request(app.getHttpServer())
      .put(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .send({ name: 'New Name' })
      .expect(404);
  });

  // ─── DELETE /folders/:id ───────────────────────────────────────────────────

  it('deletes a folder and returns 204', async () => {
    await request(app.getHttpServer())
      .delete(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .expect(204);

    expect(deleteFolderUseCase.execute).toHaveBeenCalledWith(FOLDER_ID, USER_ID);
  });

  it('propagates NotFoundException from delete use case', async () => {
    deleteFolderUseCase.execute.mockRejectedValue(
      new NotFoundException(`Folder ${FOLDER_ID} not found`),
    );

    await request(app.getHttpServer())
      .delete(`/folders/${FOLDER_ID}`)
      .set(authHeader())
      .expect(404);
  });

  // ─── POST /folders/:id/documents/:docId ────────────────────────────────────

  it('moves a document to a folder and returns success message', async () => {
    const response = await request(app.getHttpServer())
      .post(`/folders/${FOLDER_ID}/documents/${DOC_ID}`)
      .set(authHeader())
      .expect(200);

    expect(moveDocumentToFolderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        folderId: FOLDER_ID,
        documentId: DOC_ID,
      }),
    );
    expect(response.body).toMatchObject({
      message: `Document ${DOC_ID} successfully moved to folder ${FOLDER_ID}`,
    });
  });

  it('propagates NotFoundException when folder does not exist', async () => {
    moveDocumentToFolderUseCase.execute.mockRejectedValue(
      new NotFoundException(`Folder ${FOLDER_ID} not found`),
    );

    await request(app.getHttpServer())
      .post(`/folders/${FOLDER_ID}/documents/${DOC_ID}`)
      .set(authHeader())
      .expect(404);
  });

  it('propagates NotFoundException when document does not exist', async () => {
    moveDocumentToFolderUseCase.execute.mockRejectedValue(
      new NotFoundException(`Document ${DOC_ID} not found`),
    );

    await request(app.getHttpServer())
      .post(`/folders/${FOLDER_ID}/documents/${DOC_ID}`)
      .set(authHeader())
      .expect(404);
  });
});
