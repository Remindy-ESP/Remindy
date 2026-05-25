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
import { BudgetController } from '../src/modules/budgets/presentation/controllers/budget.controller';
import { BudgetService } from '../src/modules/budgets/application/services/budget.service';
import { Budget } from '../src/modules/budgets/domain/budget.entity';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const USER_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'user-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const BUDGET_ID = 'bgt--cccc-cccc-cccc-cccccccccccc';

const TOKEN_MAP: Record<string, { id: string; role: Role }> = {
  'user-token': { id: USER_ID, role: Role.USER_PREMIUM },
  'other-token': { id: OTHER_USER_ID, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
    request.user = payload;
    return true;
  }
}

function makeBudget(
  overrides: Partial<ConstructorParameters<typeof Budget>[0]> = {},
): Budget {
  return new Budget({
    id: BUDGET_ID,
    userId: USER_ID,
    name: 'Streaming',
    amount: 50,
    currency: 'EUR',
    period: 'monthly',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-02-01T00:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('Budgets Module (e2e)', () => {
  let app: INestApplication;
  const budgetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    calculateSpendingForBudget: jest.fn(),
    getBudgetsWithSpending: jest.fn(),
  };

  const userRepository = { findOne: jest.fn() };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });
  const noopThrottlerGuard: CanActivate = { canActivate: () => true };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        Reflector,
        { provide: BudgetService, useValue: budgetService },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
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
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    budgetService.findAll.mockResolvedValue([makeBudget()]);
    budgetService.findOne.mockResolvedValue(makeBudget());
    budgetService.create.mockResolvedValue(makeBudget());
    budgetService.update.mockResolvedValue(makeBudget({ name: 'Updated' }));
    budgetService.remove.mockResolvedValue(undefined);
    budgetService.calculateSpendingForBudget.mockResolvedValue({
      spent: 12.5,
      remaining: 37.5,
      progress: 0.25,
      isOverBudget: false,
      windowStart: new Date('2026-01-01T00:00:00.000Z'),
      windowEnd: new Date('2026-02-01T00:00:00.000Z'),
    });
    budgetService.getBudgetsWithSpending.mockResolvedValue([
      {
        budget: makeBudget(),
        spending: {
          spent: 12.5,
          remaining: 37.5,
          progress: 0.25,
          isOverBudget: false,
          windowStart: new Date('2026-01-01T00:00:00.000Z'),
          windowEnd: new Date('2026-02-01T00:00:00.000Z'),
        },
      },
    ]);
  });

  describe('GET /budgets', () => {
    it('returns the caller budgets', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(budgetService.findAll).toHaveBeenCalledWith({
        userId: USER_ID,
        isActive: undefined,
        categoryId: undefined,
      });
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ id: BUDGET_ID, name: 'Streaming' });
    });

    it('passes isActive=true filter', async () => {
      await request(app.getHttpServer())
        .get('/budgets')
        .set(authHeaderFor('user-token'))
        .query({ isActive: 'true' })
        .expect(200);
      expect(budgetService.findAll).toHaveBeenCalledWith({
        userId: USER_ID,
        isActive: true,
        categoryId: undefined,
      });
    });

    it('passes categoryId filter', async () => {
      await request(app.getHttpServer())
        .get('/budgets')
        .set(authHeaderFor('user-token'))
        .query({ categoryId: 'cat-1' })
        .expect(200);
      expect(budgetService.findAll).toHaveBeenCalledWith({
        userId: USER_ID,
        isActive: undefined,
        categoryId: 'cat-1',
      });
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/budgets').expect(401);
    });
  });

  describe('GET /budgets/with-spending', () => {
    it('returns budgets enriched with spending', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/with-spending')
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: BUDGET_ID,
        spent: 12.5,
        remaining: 37.5,
        progress: 0.25,
        isOverBudget: false,
      });
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/budgets/with-spending').expect(401);
    });
  });

  describe('GET /budgets/:id', () => {
    it('returns a budget detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(budgetService.findOne).toHaveBeenCalledWith(BUDGET_ID, USER_ID);
      expect(response.body).toMatchObject({ id: BUDGET_ID, name: 'Streaming' });
    });

    it('returns 404 when not found', async () => {
      budgetService.findOne.mockRejectedValueOnce(
        new NotFoundException('Budget with ID missing not found'),
      );
      await request(app.getHttpServer())
        .get(`/budgets/missing`)
        .set(authHeaderFor('user-token'))
        .expect(404);
    });

    it('returns 403 when accessed by another user', async () => {
      budgetService.findOne.mockRejectedValueOnce(
        new ForbiddenException('You can only access your own budgets'),
      );
      await request(app.getHttpServer())
        .get(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('other-token'))
        .expect(403);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get(`/budgets/${BUDGET_ID}`).expect(401);
    });
  });

  describe('GET /budgets/:id/spending', () => {
    it('returns the spending for a single budget', async () => {
      const response = await request(app.getHttpServer())
        .get(`/budgets/${BUDGET_ID}/spending`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(budgetService.findOne).toHaveBeenCalledWith(BUDGET_ID, USER_ID);
      expect(response.body).toMatchObject({
        id: BUDGET_ID,
        spent: 12.5,
        progress: 0.25,
      });
    });
  });

  describe('POST /budgets', () => {
    const validBody = {
      name: 'Streaming',
      amount: 50,
      currency: 'EUR',
      period: 'monthly' as const,
      startDate: '2026-01-01T00:00:00.000Z',
    };

    it('creates a budget and returns 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set(authHeaderFor('user-token'))
        .send(validBody)
        .expect(201);

      expect(budgetService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          name: 'Streaming',
          amount: 50,
          currency: 'EUR',
          period: 'monthly',
        }),
      );
      expect(response.body).toMatchObject({ id: BUDGET_ID, name: 'Streaming' });
    });

    it('coerces currency to upper case', async () => {
      await request(app.getHttpServer())
        .post('/budgets')
        .set(authHeaderFor('user-token'))
        .send({ ...validBody, currency: 'usd' })
        .expect(201);

      expect(budgetService.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' }),
      );
    });

    it('persists explicit endDate', async () => {
      await request(app.getHttpServer())
        .post('/budgets')
        .set(authHeaderFor('user-token'))
        .send({ ...validBody, endDate: '2026-03-01T00:00:00.000Z' })
        .expect(201);

      const passed = budgetService.create.mock.calls[0][0];
      expect(passed.endDate).toEqual(new Date('2026-03-01T00:00:00.000Z'));
    });

    it('persists categoryId when provided', async () => {
      const categoryId = '11111111-2222-4333-8444-555555555555';
      await request(app.getHttpServer())
        .post('/budgets')
        .set(authHeaderFor('user-token'))
        .send({ ...validBody, categoryId })
        .expect(201);

      expect(budgetService.create).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId }),
      );
    });
  });

  describe('PATCH /budgets/:id', () => {
    it('updates a budget and returns 200', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('user-token'))
        .send({ name: 'Updated', amount: 75 })
        .expect(200);

      expect(budgetService.update).toHaveBeenCalledWith(
        BUDGET_ID,
        expect.objectContaining({ name: 'Updated', amount: 75 }),
        USER_ID,
      );
      expect(response.body).toMatchObject({ name: 'Updated' });
    });

    it('supports nulling the endDate by passing null', async () => {
      await request(app.getHttpServer())
        .patch(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('user-token'))
        .send({ endDate: null })
        .expect(200);

      expect(budgetService.update).toHaveBeenCalledWith(
        BUDGET_ID,
        expect.objectContaining({ endDate: null }),
        USER_ID,
      );
    });

    it('passes userId from JWT for ownership check', async () => {
      await request(app.getHttpServer())
        .patch(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('other-token'))
        .send({ name: 'Hijacked' })
        .expect(200);

      expect(budgetService.update).toHaveBeenCalledWith(
        BUDGET_ID,
        expect.objectContaining({ name: 'Hijacked' }),
        OTHER_USER_ID,
      );
    });
  });

  describe('DELETE /budgets/:id', () => {
    it('deletes a budget and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('user-token'))
        .expect(204);

      expect(budgetService.remove).toHaveBeenCalledWith(BUDGET_ID, USER_ID);
    });

    it('passes userId from JWT for ownership check', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${BUDGET_ID}`)
        .set(authHeaderFor('other-token'))
        .expect(204);

      expect(budgetService.remove).toHaveBeenCalledWith(BUDGET_ID, OTHER_USER_ID);
    });
  });
});
