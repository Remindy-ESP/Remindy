import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionController } from '../src/modules/subscription/presentation/controllers/subscription.controller';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../src/modules/subscription/infrastructure/persistence/subscription.entity';
import { CreateSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/create-subscription.use-case';
import { UpdateSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/update-subscription.use-case';
import { DeleteSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/delete-subscription.use-case';
import { FindSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from '../src/modules/subscription/application/use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionsByPeriodUseCase } from '../src/modules/subscription/application/use-cases/find-subscriptions-by-period.use-case';
import { PauseSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/resume-subscription.use-case';
import { FindSubscriptionEventsUseCase } from '../src/modules/subscription/application/use-cases/find-subscription-events.use-case';
import { Subscription } from '../src/modules/subscription/domain/subscription.entity';

const USER_ID = 'user-1111-1111-1111-111111111111';
const OTHER_USER_ID = 'other-2222-2222-2222-222222222222';
const SUB_ID = 'sub--3333-3333-3333-333333333333';
const SUB_ID_2 = 'sub--4444-4444-4444-444444444444';

const makeSubscription = (overrides: Partial<Record<string, unknown>> = {}): Subscription =>
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
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
    ...(overrides as Parameters<(typeof Subscription)['prototype']['constructor']>[0]),
  });

describe('Subscription Module (e2e)', () => {
  let app: INestApplication;

  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const subscriptionRepository = { findOne: jest.fn(), find: jest.fn() };

  const createSubscriptionUseCase = { execute: jest.fn() };
  const updateSubscriptionUseCase = { execute: jest.fn() };
  const deleteSubscriptionUseCase = { execute: jest.fn() };
  const findSubscriptionUseCase = { findById: jest.fn() };
  const findAllSubscriptionsUseCase = { execute: jest.fn() };
  const findSubscriptionsByPeriodUseCase = { execute: jest.fn() };
  const pauseSubscriptionUseCase = { execute: jest.fn() };
  const resumeSubscriptionUseCase = { execute: jest.fn() };
  const findSubscriptionEventsUseCase = { execute: jest.fn() };

  // ThrottlerGuard override — pure mock, always allow in tests
  const noopThrottlerGuard: CanActivate = { canActivate: () => true };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  const sampleSubscription = makeSubscription();

  const sampleEvents = [
    {
      id: 'event-aaa',
      subscriptionId: SUB_ID,
      title: 'Netflix - Jan 2025',
      amount: 15.99,
      startsAt: new Date('2025-01-01T00:00:00.000Z'),
      status: 'scheduled',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
  ];

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      switch (token) {
        case 'user-token':
          return { sub: USER_ID, role: Role.USER_PREMIUM };
        case 'other-token':
          return { sub: OTHER_USER_ID, role: Role.USER_PREMIUM };
        default:
          throw new Error('invalid token');
      }
    });

    userRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === USER_ID) {
        return Promise.resolve({ id: USER_ID, mfaEnabled: false });
      }
      if (where.id === OTHER_USER_ID) {
        return Promise.resolve({ id: OTHER_USER_ID, mfaEnabled: false });
      }
      return Promise.resolve(null);
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: CreateSubscriptionUseCase, useValue: createSubscriptionUseCase },
        { provide: UpdateSubscriptionUseCase, useValue: updateSubscriptionUseCase },
        { provide: DeleteSubscriptionUseCase, useValue: deleteSubscriptionUseCase },
        { provide: FindSubscriptionUseCase, useValue: findSubscriptionUseCase },
        { provide: FindAllSubscriptionsUseCase, useValue: findAllSubscriptionsUseCase },
        { provide: FindSubscriptionsByPeriodUseCase, useValue: findSubscriptionsByPeriodUseCase },
        { provide: PauseSubscriptionUseCase, useValue: pauseSubscriptionUseCase },
        { provide: ResumeSubscriptionUseCase, useValue: resumeSubscriptionUseCase },
        { provide: FindSubscriptionEventsUseCase, useValue: findSubscriptionEventsUseCase },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
        { provide: getRepositoryToken(SubscriptionEntity), useValue: subscriptionRepository },
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
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    findSubscriptionUseCase.findById.mockResolvedValue(sampleSubscription);
    findAllSubscriptionsUseCase.execute.mockResolvedValue([sampleSubscription]);
    findSubscriptionsByPeriodUseCase.execute.mockResolvedValue([sampleSubscription]);
    createSubscriptionUseCase.execute.mockResolvedValue({
      subscription: sampleSubscription,
      eventsGenerated: 12,
    });
    updateSubscriptionUseCase.execute.mockResolvedValue(sampleSubscription);
    deleteSubscriptionUseCase.execute.mockResolvedValue(undefined);
    pauseSubscriptionUseCase.execute.mockResolvedValue(
      makeSubscription({ status: 'paused' as const }),
    );
    resumeSubscriptionUseCase.execute.mockResolvedValue(
      makeSubscription({ status: 'active' as const }),
    );
    findSubscriptionEventsUseCase.execute.mockResolvedValue(sampleEvents);
    subscriptionRepository.findOne.mockResolvedValue(null);
    subscriptionRepository.find.mockResolvedValue([]);
  });

  // ---- Auth guard ----

  it('returns 401 when no token is provided on GET /subscriptions', async () => {
    await request(app.getHttpServer()).get('/subscriptions').expect(401);
  });

  it('returns 401 when an invalid token is provided on POST /subscriptions', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('bad-token'))
      .send({ name: 'Netflix', amount: 15.99, frequency: 'monthly', startDate: '2025-01-01' })
      .expect(401);
  });

  // ---- POST /subscriptions ----

  it('POST /subscriptions - creates a subscription and returns 201', async () => {
    const payload = {
      name: 'Netflix',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: '2025-01-01',
    };

    const response = await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(createSubscriptionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        name: 'Netflix',
        amount: 15.99,
        frequency: 'monthly',
      }),
    );
    expect(response.body).toMatchObject({
      id: SUB_ID,
      userId: USER_ID,
      name: 'Netflix',
      eventsGenerated: 12,
    });
  });

  it('POST /subscriptions - returns 400 when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('user-token'))
      .send({ amount: 15.99, frequency: 'monthly', startDate: '2025-01-01' })
      .expect(400);
  });

  it('POST /subscriptions - returns 400 for invalid frequency', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('user-token'))
      .send({ name: 'Netflix', amount: 15.99, frequency: 'biannual', startDate: '2025-01-01' })
      .expect(400);
  });

  it('POST /subscriptions - returns 400 for invalid color HEX', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('user-token'))
      .send({
        name: 'Netflix',
        amount: 15.99,
        frequency: 'monthly',
        startDate: '2025-01-01',
        color: 'red',
      })
      .expect(400);
  });

  it('POST /subscriptions - returns 400 for invalid categoryId (not a UUID)', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions')
      .set(authHeaderFor('user-token'))
      .send({
        name: 'Netflix',
        amount: 15.99,
        frequency: 'monthly',
        startDate: '2025-01-01',
        categoryId: 'not-a-uuid',
      })
      .expect(400);
  });

  // ---- GET /subscriptions ----

  it('GET /subscriptions - returns list of subscriptions for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/subscriptions')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: SUB_ID, name: 'Netflix' });
  });

  it('GET /subscriptions - passes filter query params to use case', async () => {
    await request(app.getHttpServer())
      .get('/subscriptions')
      .query({ status: 'active', currency: 'EUR' })
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, status: 'active', currency: 'EUR' }),
    );
  });

  // ---- GET /subscriptions/frequency/:type ----

  it('GET /subscriptions/frequency/:type - returns subscriptions filtered by frequency', async () => {
    const response = await request(app.getHttpServer())
      .get('/subscriptions/frequency/monthly')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findSubscriptionsByPeriodUseCase.execute).toHaveBeenCalledWith('monthly');
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: 'Netflix' });
  });

  it('GET /subscriptions/frequency/:type - returns empty array when no subscriptions match', async () => {
    findSubscriptionsByPeriodUseCase.execute.mockResolvedValueOnce([
      makeSubscription({ userId: OTHER_USER_ID, id: SUB_ID_2 }),
    ]);

    const response = await request(app.getHttpServer())
      .get('/subscriptions/frequency/yearly')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  // ---- GET /subscriptions/:id ----

  it('GET /subscriptions/:id - returns subscription by ID for its owner', async () => {
    const response = await request(app.getHttpServer())
      .get(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(SUB_ID);
    expect(response.body).toMatchObject({ id: SUB_ID, name: 'Netflix' });
  });

  it('GET /subscriptions/:id - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .get(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  // ---- PUT /subscriptions/:id ----

  it('PUT /subscriptions/:id - updates subscription and returns updated response', async () => {
    const updatedSub = makeSubscription({ name: 'Netflix HD' });
    updateSubscriptionUseCase.execute.mockResolvedValueOnce(updatedSub);

    const response = await request(app.getHttpServer())
      .put(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ name: 'Netflix HD', amount: 17.99 })
      .expect(200);

    expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(SUB_ID);
    expect(updateSubscriptionUseCase.execute).toHaveBeenCalledWith(
      SUB_ID,
      expect.objectContaining({ name: 'Netflix HD', amount: 17.99 }),
    );
    expect(response.body).toMatchObject({ name: 'Netflix HD' });
  });

  it('PUT /subscriptions/:id - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .put(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ name: 'Updated' })
      .expect(404);
  });

  it('PUT /subscriptions/:id - returns 400 for invalid color HEX', async () => {
    await request(app.getHttpServer())
      .put(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ color: 'blue' })
      .expect(400);
  });

  it('PUT /subscriptions/:id - returns 400 for invalid frequency value', async () => {
    await request(app.getHttpServer())
      .put(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .send({ frequency: 'daily' })
      .expect(400);
  });

  // ---- DELETE /subscriptions/:id ----

  it('DELETE /subscriptions/:id - deletes subscription and returns 204', async () => {
    await request(app.getHttpServer())
      .delete(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(deleteSubscriptionUseCase.execute).toHaveBeenCalledWith(SUB_ID);
  });

  it('DELETE /subscriptions/:id - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .delete(`/subscriptions/${SUB_ID}`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  it('DELETE /subscriptions/:id - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).delete(`/subscriptions/${SUB_ID}`).expect(401);
  });

  // ---- POST /subscriptions/:id/pause ----

  it('POST /subscriptions/:id/pause - pauses a subscription', async () => {
    const response = await request(app.getHttpServer())
      .post(`/subscriptions/${SUB_ID}/pause`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(pauseSubscriptionUseCase.execute).toHaveBeenCalledWith(SUB_ID);
    expect(response.body).toMatchObject({ id: SUB_ID, status: 'paused' });
  });

  it('POST /subscriptions/:id/pause - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .post(`/subscriptions/${SUB_ID}/pause`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  // ---- POST /subscriptions/:id/resume ----

  it('POST /subscriptions/:id/resume - resumes a paused subscription', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ status: 'paused' as const }),
    );

    const response = await request(app.getHttpServer())
      .post(`/subscriptions/${SUB_ID}/resume`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(resumeSubscriptionUseCase.execute).toHaveBeenCalledWith(SUB_ID);
    expect(response.body).toMatchObject({ id: SUB_ID, status: 'active' });
  });

  it('POST /subscriptions/:id/resume - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .post(`/subscriptions/${SUB_ID}/resume`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  // ---- GET /subscriptions/:id/events ----

  it('GET /subscriptions/:id/events - returns list of events for a subscription', async () => {
    const response = await request(app.getHttpServer())
      .get(`/subscriptions/${SUB_ID}/events`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findSubscriptionEventsUseCase.execute).toHaveBeenCalledWith(SUB_ID);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      subscriptionId: SUB_ID,
      title: 'Netflix - Jan 2025',
    });
  });

  it('GET /subscriptions/:id/events - returns 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce(
      makeSubscription({ userId: OTHER_USER_ID }),
    );

    await request(app.getHttpServer())
      .get(`/subscriptions/${SUB_ID}/events`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  it('GET /subscriptions/:id/events - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get(`/subscriptions/${SUB_ID}/events`).expect(401);
  });
});
