import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

import { EventSeriesController } from '../src/modules/event-series/presentation/controllers/event-series.controller';
import { CreateEventSeriesUseCase } from '../src/modules/event-series/application/use-cases/create-event-series.use-case';
import { FindEventSeriesBySubscriptionUseCase } from '../src/modules/event-series/application/use-cases/find-event-series-by-subscription.use-case';
import { GenerateEventsFromSeriesUseCase } from '../src/modules/event-series/application/use-cases/generate-events-from-series.use-case';
import { FindSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/find-subscription.use-case';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';

const validSeriesId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const validSubId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const validUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const sampleSeries = {
  id: validSeriesId,
  subscriptionId: validSubId,
  rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
  dtstart: new Date('2025-01-15T00:00:00Z'),
  timezone: 'Europe/Paris',
  exdates: [],
  rdates: [],
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const sampleSubscription = {
  id: validSubId,
  userId: validUserId,
  name: 'Netflix',
  amount: 15.99,
  currency: 'EUR',
  billingCycle: 'monthly',
  status: 'active',
  startDate: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const sampleOccurrence = {
  id: 'event-occ-1',
  subscriptionId: validSubId,
  title: 'Netflix Payment',
  amount: 15.99,
  startsAt: new Date('2025-02-15T00:00:00Z'),
  status: 'scheduled',
  paymentStatus: 'pending',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

describe('EventSeriesController (e2e)', () => {
  let app: INestApplication;

  const createEventSeriesUseCase = { execute: jest.fn() };
  const findBySubscriptionUseCase = { execute: jest.fn() };
  const generateEventsUseCase = { execute: jest.fn() };
  const findSubscriptionUseCase = { findById: jest.fn() };

  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const userRepository = { findOne: jest.fn() };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      if (token === 'other-user-token') return { sub: 'other-user-id', role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });

    userRepository.findOne.mockResolvedValue({ id: validUserId, mfaEnabled: false });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventSeriesController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: CreateEventSeriesUseCase, useValue: createEventSeriesUseCase },
        { provide: FindEventSeriesBySubscriptionUseCase, useValue: findBySubscriptionUseCase },
        { provide: GenerateEventsFromSeriesUseCase, useValue: generateEventsUseCase },
        { provide: FindSubscriptionUseCase, useValue: findSubscriptionUseCase },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
      ],
    })
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

    createEventSeriesUseCase.execute.mockResolvedValue(sampleSeries);
    findBySubscriptionUseCase.execute.mockResolvedValue(sampleSeries);
    generateEventsUseCase.execute.mockResolvedValue([sampleOccurrence]);
    findSubscriptionUseCase.findById.mockResolvedValue(sampleSubscription);

    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      if (token === 'other-user-token') return { sub: 'other-user-id', role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });
  });

  // ─── Authentication ──────────────────────────────────────────────────────────

  it('POST /event-series — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .send({
        subscriptionId: validSubId,
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
        dtstart: '2025-01-15T00:00:00Z',
      })
      .expect(401);
  });

  it('POST /event-series — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('bad-token'))
      .send({
        subscriptionId: validSubId,
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
        dtstart: '2025-01-15T00:00:00Z',
      })
      .expect(401);
  });

  // ─── POST /event-series ──────────────────────────────────────────────────────

  it('POST /event-series — creates a new event series for subscription owner', async () => {
    const payload = {
      subscriptionId: validSubId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
      dtstart: '2025-01-15T00:00:00Z',
      timezone: 'Europe/Paris',
    };

    const response = await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(validSubId);
    expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: validSubId,
        rrule: payload.rrule,
        dtstart: new Date(payload.dtstart),
        timezone: 'Europe/Paris',
      }),
    );
    expect(response.body.id).toBe(validSeriesId);
    expect(response.body.subscriptionId).toBe(validSubId);
    expect(response.body.rrule).toBe(payload.rrule);
  });

  it('POST /event-series — creates with optional exdates and rdates', async () => {
    const payload = {
      subscriptionId: validSubId,
      rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
      dtstart: '2025-01-15T00:00:00Z',
      exdates: ['2025-08-15T00:00:00Z'],
      rdates: ['2025-03-21T00:00:00Z'],
    };

    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        exdates: [new Date('2025-08-15T00:00:00Z')],
        rdates: [new Date('2025-03-21T00:00:00Z')],
      }),
    );
  });

  it('POST /event-series — 400 when subscriptionId is missing', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send({
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
        dtstart: '2025-01-15T00:00:00Z',
      })
      .expect(400);
  });

  it('POST /event-series — 400 when rrule is missing', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send({
        subscriptionId: validSubId,
        dtstart: '2025-01-15T00:00:00Z',
      })
      .expect(400);
  });

  it('POST /event-series — 400 when dtstart is missing', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send({
        subscriptionId: validSubId,
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
      })
      .expect(400);
  });

  it('POST /event-series — 400 when dtstart is not a valid ISO date', async () => {
    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send({
        subscriptionId: validSubId,
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
        dtstart: 'not-a-date',
      })
      .expect(400);
  });

  it('POST /event-series — 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .post('/event-series')
      .set(authHeaderFor('user-token'))
      .send({
        subscriptionId: validSubId,
        rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
        dtstart: '2025-01-15T00:00:00Z',
      })
      .expect(404);

    expect(createEventSeriesUseCase.execute).not.toHaveBeenCalled();
  });

  // ─── GET /event-series/subscription/:subscriptionId ─────────────────────────

  it('GET /event-series/subscription/:subscriptionId — returns series for owner', async () => {
    const response = await request(app.getHttpServer())
      .get(`/event-series/subscription/${validSubId}`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(validSubId);
    expect(findBySubscriptionUseCase.execute).toHaveBeenCalledWith(validSubId);
    expect(response.body.id).toBe(validSeriesId);
    expect(response.body.subscriptionId).toBe(validSubId);
  });

  it('GET /event-series/subscription/:subscriptionId — 404 when subscription belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .get(`/event-series/subscription/${validSubId}`)
      .set(authHeaderFor('user-token'))
      .expect(404);

    expect(findBySubscriptionUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /event-series/subscription/:subscriptionId — 401 with no token', async () => {
    await request(app.getHttpServer()).get(`/event-series/subscription/${validSubId}`).expect(401);
  });

  // ─── GET /event-series/:id/generate ─────────────────────────────────────────

  it('GET /event-series/:id/generate — returns generated occurrences for owner', async () => {
    const response = await request(app.getHttpServer())
      .get(`/event-series/${validSeriesId}/generate`)
      .set(authHeaderFor('user-token'))
      .query({
        start: '2025-01-01T00:00:00Z',
        end: '2025-12-31T23:59:59Z',
        max: 12,
      })
      .expect(200);

    expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
      validSeriesId,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-12-31T23:59:59Z'),
      12,
    );
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /event-series/:id/generate — uses defaults when no query params provided', async () => {
    await request(app.getHttpServer())
      .get(`/event-series/${validSeriesId}/generate`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
      validSeriesId,
      expect.any(Date),
      expect.any(Date),
      365,
    );
  });

  it('GET /event-series/:id/generate — returns empty array when no occurrences', async () => {
    generateEventsUseCase.execute.mockResolvedValueOnce([]);

    const response = await request(app.getHttpServer())
      .get(`/event-series/${validSeriesId}/generate`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(response.body).toEqual([]);
    // findSubscriptionUseCase not called when occurrences is empty
    expect(findSubscriptionUseCase.findById).not.toHaveBeenCalled();
  });

  it('GET /event-series/:id/generate — 404 when occurrences belong to another user', async () => {
    generateEventsUseCase.execute.mockResolvedValueOnce([sampleOccurrence]);
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .get(`/event-series/${validSeriesId}/generate`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  it('GET /event-series/:id/generate — 401 with no token', async () => {
    await request(app.getHttpServer()).get(`/event-series/${validSeriesId}/generate`).expect(401);
  });
});
