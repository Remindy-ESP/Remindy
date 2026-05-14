import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SubscriptionController } from '../src/modules/subscription/presentation/controllers/subscription.controller';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { SubscriptionEntity } from '../src/modules/subscription/infrastructure/persistence/subscription.entity';
import { Subscription } from '../src/modules/subscription/domain/subscription.entity';

import { CreateSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/create-subscription.use-case';
import { UpdateSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/update-subscription.use-case';
import { DeleteSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/delete-subscription.use-case';
import { FindSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from '../src/modules/subscription/application/use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionsByPeriodUseCase } from '../src/modules/subscription/application/use-cases/find-subscriptions-by-period.use-case';
import { PauseSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/resume-subscription.use-case';
import { FindSubscriptionEventsUseCase } from '../src/modules/subscription/application/use-cases/find-subscription-events.use-case';

const USER_ID = 'user-1111-1111-1111-111111111111';
const OTHER_USER_ID = 'other-2222-2222-2222-222222222222';
const SUB_ID = 'sub-3333-3333-3333-333333333333';

const TOKEN_MAP: Record<string, { userId: string; role: Role }> = {
  'user-token': { userId: USER_ID, role: Role.USER_PREMIUM },
  'other-token': { userId: OTHER_USER_ID, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = auth.slice(7);
    const payload = TOKEN_MAP[token];

    if (!payload) {
      throw new UnauthorizedException();
    }

    req.user = payload;
    return true;
  }
}

const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  new Subscription({
    id: SUB_ID,
    userId: USER_ID,
    name: 'Netflix',
    amount: 15.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('SubscriptionController (e2e)', () => {
  let app: INestApplication;

  // ✅ USE CASE MOCKS
  const createSubscriptionUseCase = { execute: jest.fn() };
  const updateSubscriptionUseCase = { execute: jest.fn() };
  const deleteSubscriptionUseCase = { execute: jest.fn() };
  const findSubscriptionUseCase = { findById: jest.fn() };
  const findAllSubscriptionsUseCase = { execute: jest.fn() };
  const findSubscriptionsByPeriodUseCase = { execute: jest.fn() };
  const pauseSubscriptionUseCase = { execute: jest.fn() };
  const resumeSubscriptionUseCase = { execute: jest.fn() };
  const findSubscriptionEventsUseCase = { execute: jest.fn() };

  // ✅ IMPORTANT FIX (TON ERREUR)
  const subscriptionRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  const sample = makeSubscription();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        { provide: CreateSubscriptionUseCase, useValue: createSubscriptionUseCase },
        { provide: UpdateSubscriptionUseCase, useValue: updateSubscriptionUseCase },
        { provide: DeleteSubscriptionUseCase, useValue: deleteSubscriptionUseCase },
        { provide: FindSubscriptionUseCase, useValue: findSubscriptionUseCase },
        { provide: FindAllSubscriptionsUseCase, useValue: findAllSubscriptionsUseCase },
        { provide: FindSubscriptionsByPeriodUseCase, useValue: findSubscriptionsByPeriodUseCase },
        { provide: PauseSubscriptionUseCase, useValue: pauseSubscriptionUseCase },
        { provide: ResumeSubscriptionUseCase, useValue: resumeSubscriptionUseCase },
        { provide: FindSubscriptionEventsUseCase, useValue: findSubscriptionEventsUseCase },

        // 🔥 FIX CRUCIAL
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: subscriptionRepositoryMock,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtAuthGuard())
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
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    findSubscriptionUseCase.findById.mockResolvedValue(sample);
    findAllSubscriptionsUseCase.execute.mockResolvedValue([sample]);
    findSubscriptionsByPeriodUseCase.execute.mockResolvedValue([sample]);

    createSubscriptionUseCase.execute.mockResolvedValue({
      subscription: sample,
      eventsGenerated: 12,
    });

    updateSubscriptionUseCase.execute.mockResolvedValue(sample);
    deleteSubscriptionUseCase.execute.mockResolvedValue(undefined);

    pauseSubscriptionUseCase.execute.mockResolvedValue(
      makeSubscription({ status: 'paused' }),
    );

    resumeSubscriptionUseCase.execute.mockResolvedValue(
      makeSubscription({ status: 'active' }),
    );

    findSubscriptionEventsUseCase.execute.mockResolvedValue([
      { id: 'event-1', subscriptionId: SUB_ID, title: 'Netflix - Jan' },
    ]);
  });

  it('GET /subscriptions - 401 without token', async () => {
    await request(app.getHttpServer()).get('/subscriptions').expect(401);
  });

  it('POST /subscriptions - create subscription', async () => {
    const res = await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeader('user-token'))
      .send({
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: '2025-01-01',
      })
      .expect(201);

    expect(createSubscriptionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );

    expect(res.body.userId).toBe(USER_ID);
  });

  it('GET /subscriptions', async () => {
    const res = await request(app.getHttpServer())
      .get('/subscriptions')
      .set(authHeader('user-token'))
      .expect(200);

    expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );

    expect(res.body.length).toBe(1);
  });

  it('GET /subscriptions/:id - forbidden if not owner', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .get(`/subscriptions/${SUB_ID}`)
      .set(authHeader('user-token'))
      .expect(404);
  });

  it('DELETE /subscriptions/:id', async () => {
    await request(app.getHttpServer())
      .delete(`/subscriptions/${SUB_ID}`)
      .set(authHeader('user-token'))
      .expect(204);

    expect(deleteSubscriptionUseCase.execute).toHaveBeenCalledWith(SUB_ID);
  });
});