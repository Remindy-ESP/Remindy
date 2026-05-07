import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

import { EventController } from '../src/modules/event/presentation/controllers/event.controller';
import { FindAllEventsUseCase } from '../src/modules/event/application/use-cases/find-all-events.use-case';
import { GetEventByIdUseCase } from '../src/modules/event/application/use-cases/get-event-by-id.use-case';
import { RescheduleEventUseCase } from '../src/modules/event/application/use-cases/reschedule-event.use-case';
import { UpdateEventStatusUseCase } from '../src/modules/event/application/use-cases/update-event-status.use-case';
import { UpdateEventPaymentStatusUseCase } from '../src/modules/event/application/use-cases/update-event-payment-status.use-case';
import { DeleteEventUseCase } from '../src/modules/event/application/use-cases/delete-event.use-case';
import { FindSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from '../src/modules/subscription/application/use-cases/find-all-subscriptions.use-case';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';

const validEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const validSubId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const validUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const sampleEvent = {
  id: validEventId,
  subscriptionId: validSubId,
  eventSeriesId: undefined,
  title: 'Netflix Payment',
  notes: 'monthly',
  amount: 15.99,
  startsAt: new Date('2025-02-01T00:00:00.000Z'),
  endsAt: new Date('2025-02-01T01:00:00.000Z'),
  status: 'scheduled',
  paymentStatus: 'pending',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
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

describe('EventController (e2e)', () => {
  let app: INestApplication;

  const findAllEventsUseCase = { execute: jest.fn() };
  const getEventByIdUseCase = { execute: jest.fn() };
  const rescheduleEventUseCase = { execute: jest.fn() };
  const updateEventStatusUseCase = { execute: jest.fn() };
  const updateEventPaymentStatusUseCase = { execute: jest.fn() };
  const deleteEventUseCase = { execute: jest.fn() };
  const findSubscriptionUseCase = { findById: jest.fn() };
  const findAllSubscriptionsUseCase = { execute: jest.fn() };

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
      controllers: [EventController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: FindAllEventsUseCase, useValue: findAllEventsUseCase },
        { provide: GetEventByIdUseCase, useValue: getEventByIdUseCase },
        { provide: RescheduleEventUseCase, useValue: rescheduleEventUseCase },
        { provide: UpdateEventStatusUseCase, useValue: updateEventStatusUseCase },
        { provide: UpdateEventPaymentStatusUseCase, useValue: updateEventPaymentStatusUseCase },
        { provide: DeleteEventUseCase, useValue: deleteEventUseCase },
        { provide: FindSubscriptionUseCase, useValue: findSubscriptionUseCase },
        { provide: FindAllSubscriptionsUseCase, useValue: findAllSubscriptionsUseCase },
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

    findAllEventsUseCase.execute.mockResolvedValue([sampleEvent]);
    getEventByIdUseCase.execute.mockResolvedValue(sampleEvent);
    rescheduleEventUseCase.execute.mockResolvedValue(sampleEvent);
    updateEventStatusUseCase.execute.mockResolvedValue({ ...sampleEvent, status: 'completed' });
    updateEventPaymentStatusUseCase.execute.mockResolvedValue({
      ...sampleEvent,
      paymentStatus: 'paid',
    });
    deleteEventUseCase.execute.mockResolvedValue(undefined);
    findSubscriptionUseCase.findById.mockResolvedValue(sampleSubscription);
    findAllSubscriptionsUseCase.execute.mockResolvedValue([sampleSubscription]);

    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      if (token === 'other-user-token') return { sub: 'other-user-id', role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });
  });

  // ─── Authentication ──────────────────────────────────────────────────────────

  it('GET /calendar/events — 401 when no token provided', async () => {
    await request(app.getHttpServer()).get('/calendar/events').expect(401);
  });

  it('GET /calendar/events — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .get('/calendar/events')
      .set(authHeaderFor('bad-token'))
      .expect(401);
  });

  // ─── GET /calendar/events ────────────────────────────────────────────────────

  it('GET /calendar/events — returns filtered events for current user', async () => {
    const response = await request(app.getHttpServer())
      .get('/calendar/events')
      .set(authHeaderFor('user-token'))
      .query({ status: 'scheduled' })
      .expect(200);

    expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith({ userId: validUserId });
    expect(findAllEventsUseCase.execute).toHaveBeenCalled();
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe(validEventId);
    expect(response.body[0].subscriptionId).toBe(validSubId);
    expect(response.body[0].userId).toBe(validUserId);
  });

  it('GET /calendar/events — returns empty array when user has no subscriptions', async () => {
    findAllSubscriptionsUseCase.execute.mockResolvedValueOnce([]);
    findAllEventsUseCase.execute.mockResolvedValueOnce([sampleEvent]);

    const response = await request(app.getHttpServer())
      .get('/calendar/events')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('GET /calendar/events — filters events by subscriptionId', async () => {
    const response = await request(app.getHttpServer())
      .get('/calendar/events')
      .set(authHeaderFor('user-token'))
      .query({ subscription_id: validSubId })
      .expect(200);

    expect(findAllEventsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: validSubId }),
    );
    expect(response.body).toHaveLength(1);
  });

  // ─── GET /calendar/event/:id ─────────────────────────────────────────────────

  it('GET /calendar/event/:id — returns event by id for owner', async () => {
    const response = await request(app.getHttpServer())
      .get(`/calendar/event/${validEventId}`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(getEventByIdUseCase.execute).toHaveBeenCalledWith(validEventId);
    expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(validSubId);
    expect(response.body.id).toBe(validEventId);
  });

  it('GET /calendar/event/:id — 404 when event belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .get(`/calendar/event/${validEventId}`)
      .set(authHeaderFor('user-token'))
      .expect(404);
  });

  it('GET /calendar/event/:id — 401 with no token', async () => {
    await request(app.getHttpServer()).get(`/calendar/event/${validEventId}`).expect(401);
  });

  // ─── PUT /calendar/event/:id/reschedule ──────────────────────────────────────

  it('PUT /calendar/event/:id/reschedule — reschedules event for owner', async () => {
    const payload = {
      starts_at: '2025-03-01T10:00:00Z',
      ends_at: '2025-03-01T11:00:00Z',
      notes: 'moved',
    };

    const response = await request(app.getHttpServer())
      .put(`/calendar/event/${validEventId}/reschedule`)
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(200);

    expect(rescheduleEventUseCase.execute).toHaveBeenCalledWith(
      validEventId,
      expect.objectContaining({
        startsAt: new Date('2025-03-01T10:00:00Z'),
        endsAt: new Date('2025-03-01T11:00:00Z'),
        notes: 'moved',
      }),
    );
    expect(response.body.id).toBe(validEventId);
  });

  it('PUT /calendar/event/:id/reschedule — 400 when starts_at is missing', async () => {
    await request(app.getHttpServer())
      .put(`/calendar/event/${validEventId}/reschedule`)
      .set(authHeaderFor('user-token'))
      .send({ notes: 'no date' })
      .expect(400);
  });

  it('PUT /calendar/event/:id/reschedule — 400 when starts_at is not a valid date', async () => {
    await request(app.getHttpServer())
      .put(`/calendar/event/${validEventId}/reschedule`)
      .set(authHeaderFor('user-token'))
      .send({ starts_at: 'not-a-date' })
      .expect(400);
  });

  it('PUT /calendar/event/:id/reschedule — 404 when event belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .put(`/calendar/event/${validEventId}/reschedule`)
      .set(authHeaderFor('user-token'))
      .send({ starts_at: '2025-03-01T10:00:00Z' })
      .expect(404);
  });

  it('PUT /calendar/event/:id/reschedule — 401 with no token', async () => {
    await request(app.getHttpServer())
      .put(`/calendar/event/${validEventId}/reschedule`)
      .send({ starts_at: '2025-03-01T10:00:00Z' })
      .expect(401);
  });

  // ─── PATCH /calendar/event/:id/status ───────────────────────────────────────

  it('PATCH /calendar/event/:id/status — updates status for owner', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/status`)
      .set(authHeaderFor('user-token'))
      .send({ status: 'completed' })
      .expect(200);

    expect(updateEventStatusUseCase.execute).toHaveBeenCalledWith(validEventId, 'completed');
    expect(response.body.status).toBe('completed');
  });

  it('PATCH /calendar/event/:id/status — 400 when status is missing', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/status`)
      .set(authHeaderFor('user-token'))
      .send({})
      .expect(400);
  });

  it('PATCH /calendar/event/:id/status — 400 when status is not a valid enum value', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/status`)
      .set(authHeaderFor('user-token'))
      .send({ status: 'unknown-status' })
      .expect(400);
  });

  it('PATCH /calendar/event/:id/status — 404 when event belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/status`)
      .set(authHeaderFor('user-token'))
      .send({ status: 'completed' })
      .expect(404);
  });

  it('PATCH /calendar/event/:id/status — 401 with no token', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/status`)
      .send({ status: 'completed' })
      .expect(401);
  });

  // ─── PATCH /calendar/event/:id/payment-status ────────────────────────────────

  it('PATCH /calendar/event/:id/payment-status — updates payment status for owner', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/payment-status`)
      .set(authHeaderFor('user-token'))
      .send({ paymentStatus: 'paid' })
      .expect(200);

    expect(updateEventPaymentStatusUseCase.execute).toHaveBeenCalledWith(validEventId, 'paid');
    expect(response.body.paymentStatus).toBe('paid');
  });

  it('PATCH /calendar/event/:id/payment-status — 400 when paymentStatus missing', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/payment-status`)
      .set(authHeaderFor('user-token'))
      .send({})
      .expect(400);
  });

  it('PATCH /calendar/event/:id/payment-status — 400 when paymentStatus invalid', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/payment-status`)
      .set(authHeaderFor('user-token'))
      .send({ paymentStatus: 'unknown' })
      .expect(400);
  });

  it('PATCH /calendar/event/:id/payment-status — 404 when event belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/payment-status`)
      .set(authHeaderFor('user-token'))
      .send({ paymentStatus: 'paid' })
      .expect(404);
  });

  it('PATCH /calendar/event/:id/payment-status — 401 with no token', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${validEventId}/payment-status`)
      .send({ paymentStatus: 'paid' })
      .expect(401);
  });

  // ─── DELETE /calendar/event/:id ──────────────────────────────────────────────

  it('DELETE /calendar/event/:id — deletes event for owner (204)', async () => {
    await request(app.getHttpServer())
      .delete(`/calendar/event/${validEventId}`)
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(deleteEventUseCase.execute).toHaveBeenCalledWith(validEventId);
  });

  it('DELETE /calendar/event/:id — 404 when event belongs to another user', async () => {
    findSubscriptionUseCase.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .delete(`/calendar/event/${validEventId}`)
      .set(authHeaderFor('user-token'))
      .expect(404);

    expect(deleteEventUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /calendar/event/:id — 401 with no token', async () => {
    await request(app.getHttpServer())
      .delete(`/calendar/event/${validEventId}`)
      .expect(401);

    expect(deleteEventUseCase.execute).not.toHaveBeenCalled();
  });
});
