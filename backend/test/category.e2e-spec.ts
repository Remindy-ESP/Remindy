import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CategoryController } from '../src/modules/category/presentation/controllers/category.controller';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { CreateCategoryUseCase } from '../src/modules/category/application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../src/modules/category/application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../src/modules/category/application/use-cases/delete-category.use-case';
import { FindCategoryByIdUseCase } from '../src/modules/category/application/use-cases/find-category-by-id.use-case';
import { FindAllCategoriesUseCase } from '../src/modules/category/application/use-cases/find-all-categories.use-case';
import { Category } from '../src/modules/category/domain/category.entity';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';

const USER_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'user-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CAT_ID = 'cat--cccc-cccc-cccc-cccccccccccc';
const CAT_ID_2 = 'cat--dddd-dddd-dddd-dddddddddddd';

const TOKEN_MAP: Record<string, { sub: string; role: Role }> = {
  'user-token': { sub: USER_ID, role: Role.USER_PREMIUM },
  'other-token': { sub: OTHER_USER_ID, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    const token = authHeader.slice(7);
    const payload = TOKEN_MAP[token];

    if (!payload) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    request.user = { userId: payload.sub, role: payload.role };
    return true;
  }
}

const makeCategory = (overrides: Partial<Record<string, unknown>> = {}): Category =>
  new Category({
    id: CAT_ID,
    name: 'Streaming',
    icon: 'play-circle',
    color: '#3B82F6',
    userId: USER_ID,
    isSystem: false,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
    ...(overrides as any),
  });

describe('Category Module (e2e)', () => {
  let app: INestApplication;

  const userRepository = { findOne: jest.fn() };

  const createCategoryUseCase = { execute: jest.fn() };
  const updateCategoryUseCase = { execute: jest.fn() };
  const deleteCategoryUseCase = { execute: jest.fn() };
  const findCategoryByIdUseCase = { execute: jest.fn() };
  const findAllCategoriesUseCase = { execute: jest.fn() };

  const noopThrottlerGuard: CanActivate = { canActivate: () => true };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  const sampleCategory = makeCategory();
  const systemCategory = new Category({
    id: CAT_ID_2,
    name: 'Travel',
    icon: 'airplane',
    color: '#10B981',
    userId: null,
    isSystem: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        Reflector,
        { provide: CreateCategoryUseCase, useValue: createCategoryUseCase },
        { provide: UpdateCategoryUseCase, useValue: updateCategoryUseCase },
        { provide: DeleteCategoryUseCase, useValue: deleteCategoryUseCase },
        { provide: FindCategoryByIdUseCase, useValue: findCategoryByIdUseCase },
        { provide: FindAllCategoriesUseCase, useValue: findAllCategoriesUseCase },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
        JwtAuthGuard,
        RolesGuard,
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(noopThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const reflector = moduleFixture.get<Reflector>(Reflector);
    app.useGlobalGuards(new TestJwtAuthGuard(reflector));

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    findCategoryByIdUseCase.execute.mockResolvedValue(sampleCategory);
    findAllCategoriesUseCase.execute.mockResolvedValue([sampleCategory, systemCategory]);
    createCategoryUseCase.execute.mockResolvedValue(sampleCategory);
    updateCategoryUseCase.execute.mockResolvedValue(sampleCategory);
    deleteCategoryUseCase.execute.mockResolvedValue(undefined);
  });

  it('POST /categories - creates a category and returns 201', async () => {
    const payload = { name: 'Streaming', icon: 'play-circle', color: '#3B82F6' };

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Streaming',
        icon: 'play-circle',
        color: '#3B82F6',
        userId: USER_ID,
        isSystem: false,
      }),
    );
    expect(response.body).toMatchObject({
      id: CAT_ID,
      name: 'Streaming',
      icon: 'play-circle',
      color: '#3B82F6',
      isSystem: false,
    });
  });

  it('POST /categories - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Streaming', icon: 'play-circle', color: '#3B82F6' })
      .expect(401);
  });

  it('POST /categories - returns 400 when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ icon: 'play-circle', color: '#3B82F6' })
      .expect(400);
  });

  it('POST /categories - returns 400 when icon is missing', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ name: 'Streaming', color: '#3B82F6' })
      .expect(400);
  });

  it('POST /categories - returns 400 when color is missing', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ name: 'Streaming', icon: 'play-circle' })
      .expect(400);
  });

  it('POST /categories - returns 400 when color is not a valid HEX code', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ name: 'Streaming', icon: 'play-circle', color: 'blue' })
      .expect(400);
  });

  it('POST /categories - returns 400 when name exceeds 100 characters', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ name: 'A'.repeat(101), icon: 'play-circle', color: '#3B82F6' })
      .expect(400);
  });

  it('POST /categories - returns 400 when icon exceeds 50 characters', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set(authHeaderFor('user-token'))
      .send({ name: 'Streaming', icon: 'a'.repeat(51), color: '#3B82F6' })
      .expect(400);
  });

  it('GET /categories - returns all categories (authenticated)', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllCategoriesUseCase.execute).toHaveBeenCalled();
    expect(response.body).toHaveLength(2);
  });

  it('GET /categories - passes userId filter when provided', async () => {
    findAllCategoriesUseCase.execute.mockResolvedValueOnce([sampleCategory]);

    const response = await request(app.getHttpServer())
      .get('/categories')
      .set(authHeaderFor('user-token'))
      .query({ userId: USER_ID })
      .expect(200);

    expect(findAllCategoriesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );
    expect(response.body).toHaveLength(1);
  });

  it('GET /categories - passes name filter when provided', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .set(authHeaderFor('user-token'))
      .query({ name: 'Stream' })
      .expect(200);

    expect(findAllCategoriesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Stream' }),
    );
  });

  it('GET /categories - filters system categories when isSystem=true', async () => {
    findAllCategoriesUseCase.execute.mockResolvedValueOnce([systemCategory]);

    const response = await request(app.getHttpServer())
      .get('/categories')
      .set(authHeaderFor('user-token'))
      .query({ isSystem: 'true' })
      .expect(200);

    expect(findAllCategoriesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ isSystem: true }),
    );
    expect(response.body).toHaveLength(1);
    expect(response.body[0].isSystem).toBe(true);
  });

  it('GET /categories/:id - returns a single category by ID (authenticated)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findCategoryByIdUseCase.execute).toHaveBeenCalledWith(CAT_ID);
    expect(response.body).toMatchObject({
      id: CAT_ID,
      name: 'Streaming',
      icon: 'play-circle',
      color: '#3B82F6',
    });
  });

  it('GET /categories/:id - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get(`/categories/${CAT_ID}`).expect(401);
  });

  it('PUT /categories/:id - updates a category and returns updated response', async () => {
    const updatedCategory = makeCategory({ name: 'Video Streaming', color: '#6366F1' });
    updateCategoryUseCase.execute.mockResolvedValueOnce(updatedCategory);

    const response = await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ name: 'Video Streaming', color: '#6366F1' })
      .expect(200);

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(
      CAT_ID,
      expect.objectContaining({ name: 'Video Streaming', color: '#6366F1' }),
      USER_ID,
    );
    expect(response.body).toMatchObject({ name: 'Video Streaming', color: '#6366F1' });
  });

  it('PUT /categories/:id - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .send({ name: 'Updated' })
      .expect(401);
  });

  it('PUT /categories/:id - returns 400 when color is not a valid HEX code', async () => {
    await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ color: 'not-hex' })
      .expect(400);
  });

  it('PUT /categories/:id - returns 400 when name exceeds 100 characters', async () => {
    await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ name: 'B'.repeat(101) })
      .expect(400);
  });

  it('PUT /categories/:id - returns 400 when icon exceeds 50 characters', async () => {
    await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ icon: 'x'.repeat(51) })
      .expect(400);
  });

  it('PUT /categories/:id - passes userId from JWT to use case for ownership check', async () => {
    await request(app.getHttpServer())
      .put(`/categories/${CAT_ID}`)
      .set(authHeaderFor('other-token'))
      .send({ name: 'Hacked Name' })
      .expect(200);

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(
      CAT_ID,
      expect.objectContaining({ name: 'Hacked Name' }),
      OTHER_USER_ID,
    );
  });

  it('DELETE /categories/:id - deletes a category and returns 204', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${CAT_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(CAT_ID, USER_ID);
  });

  it('DELETE /categories/:id - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).delete(`/categories/${CAT_ID}`).expect(401);
  });

  it('DELETE /categories/:id - passes userId from JWT to use case for ownership check', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${CAT_ID}`)
      .set(authHeaderFor('other-token'))
      .expect(204);

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(CAT_ID, OTHER_USER_ID);
  });
});
