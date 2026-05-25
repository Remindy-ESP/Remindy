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
import { StatisticsController } from '../src/modules/statistics/presentation/controllers/statistics.controller';
import { GetExpenseSummaryUseCase } from '../src/modules/statistics/application/use-cases/get-expense-summary.use-case';
import { GetComparisonUseCase } from '../src/modules/statistics/application/use-cases/get-comparison.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

const USER_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TOKEN_MAP: Record<string, { id: string; role: Role }> = {
  'user-token': { id: USER_ID, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    const payload = TOKEN_MAP[auth.slice(7)];
    if (!payload) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    req.user = payload;
    return true;
  }
}

describe('Statistics Comparison (e2e)', () => {
  let app: INestApplication;
  const summaryUseCase = { execute: jest.fn() };
  const comparisonUseCase = { execute: jest.fn() };
  const noop: CanActivate = { canActivate: () => true };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        Reflector,
        { provide: GetExpenseSummaryUseCase, useValue: summaryUseCase },
        { provide: GetComparisonUseCase, useValue: comparisonUseCase },
        { provide: getRepositoryToken(EUser), useValue: { findOne: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue(noop)
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
    comparisonUseCase.execute.mockResolvedValue({
      current: {
        start: new Date('2026-05-01T00:00:00.000Z'),
        end: new Date('2026-06-01T00:00:00.000Z'),
        total: 50,
      },
      previous: {
        start: new Date('2026-04-01T00:00:00.000Z'),
        end: new Date('2026-05-01T00:00:00.000Z'),
        total: 40,
      },
      delta: 10,
      percentageChange: 25,
      trend: 'up',
    });
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('GET /statistics/comparison returns the comparison payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/statistics/comparison')
      .set(auth('user-token'))
      .query({
        currentStart: '2026-05-01T00:00:00.000Z',
        currentEnd: '2026-06-01T00:00:00.000Z',
        compareStart: '2026-04-01T00:00:00.000Z',
        compareEnd: '2026-05-01T00:00:00.000Z',
      })
      .expect(200);

    expect(comparisonUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        currentStart: new Date('2026-05-01T00:00:00.000Z'),
        currentEnd: new Date('2026-06-01T00:00:00.000Z'),
      }),
    );
    expect(response.body).toMatchObject({
      current: { total: 50 },
      previous: { total: 40 },
      delta: 10,
      percentageChange: 25,
      trend: 'up',
    });
  });

  it('GET /statistics/comparison forwards categoryId when present', async () => {
    const categoryId = '11111111-2222-4333-8444-555555555555';
    await request(app.getHttpServer())
      .get('/statistics/comparison')
      .set(auth('user-token'))
      .query({
        currentStart: '2026-05-01T00:00:00.000Z',
        currentEnd: '2026-06-01T00:00:00.000Z',
        compareStart: '2026-04-01T00:00:00.000Z',
        compareEnd: '2026-05-01T00:00:00.000Z',
        categoryId,
      })
      .expect(200);
    expect(comparisonUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId }),
    );
  });

  it('returns 400 when required dates are missing', async () => {
    await request(app.getHttpServer())
      .get('/statistics/comparison')
      .set(auth('user-token'))
      .query({})
      .expect(400);
  });

  it('returns 400 when dates are not ISO 8601', async () => {
    await request(app.getHttpServer())
      .get('/statistics/comparison')
      .set(auth('user-token'))
      .query({
        currentStart: 'not-a-date',
        currentEnd: '2026-06-01T00:00:00.000Z',
        compareStart: '2026-04-01T00:00:00.000Z',
        compareEnd: '2026-05-01T00:00:00.000Z',
      })
      .expect(400);
  });

  it('returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/statistics/comparison').expect(401);
  });
});
