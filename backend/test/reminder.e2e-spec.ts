import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ReminderController } from '../src/modules/reminder/presentation/controllers/reminder.controller';
import { FindAllRemindersUseCase } from '../src/modules/reminder/application/use-cases/find-all-reminders.use-case';
import { FindReminderByIdUseCase } from '../src/modules/reminder/application/use-cases/find-reminder-by-id.use-case';
import { CreateReminderUseCase } from '../src/modules/reminder/application/use-cases/create-reminder.use-case';
import { UpdateReminderUseCase } from '../src/modules/reminder/application/use-cases/update-reminder.use-case';
import { DeleteReminderUseCase } from '../src/modules/reminder/application/use-cases/delete-reminder.use-case';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';

const validReminderId = '11111111-1111-4111-8111-111111111111';
const validSubId = '22222222-2222-4222-8222-222222222222';
const validUserId = '33333333-3333-4333-8333-333333333333';

const sampleReminder = {
  id: validReminderId,
  userId: validUserId,
  subscriptionId: validSubId,
  type: 'subscription_renewal',
  daysBefore: 7,
  enabled: true,
  channel: 'email',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  deletedAt: undefined,
};

describe('ReminderController (e2e)', () => {
  let app: INestApplication;

  const findAllRemindersUseCase = { execute: jest.fn() };
  const findReminderByIdUseCase = { execute: jest.fn() };
  const createReminderUseCase = { execute: jest.fn() };
  const updateReminderUseCase = { execute: jest.fn() };
  const deleteReminderUseCase = { execute: jest.fn() };

  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const userRepository = { findOne: jest.fn() };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });

    userRepository.findOne.mockResolvedValue({ id: validUserId, mfaEnabled: false });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReminderController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: FindAllRemindersUseCase, useValue: findAllRemindersUseCase },
        { provide: FindReminderByIdUseCase, useValue: findReminderByIdUseCase },
        { provide: CreateReminderUseCase, useValue: createReminderUseCase },
        { provide: UpdateReminderUseCase, useValue: updateReminderUseCase },
        { provide: DeleteReminderUseCase, useValue: deleteReminderUseCase },
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

    findAllRemindersUseCase.execute.mockResolvedValue([sampleReminder]);
    findReminderByIdUseCase.execute.mockResolvedValue(sampleReminder);
    createReminderUseCase.execute.mockResolvedValue(sampleReminder);
    updateReminderUseCase.execute.mockResolvedValue({ ...sampleReminder, daysBefore: 3 });
    deleteReminderUseCase.execute.mockResolvedValue(undefined);

    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });
  });

  // ─── Authentication ──────────────────────────────────────────────────────────

  it('GET /reminders — 401 when no token provided', async () => {
    await request(app.getHttpServer()).get('/reminders').expect(401);
  });

  it('GET /reminders — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeaderFor('bad-token'))
      .expect(401);
  });

  // ─── GET /reminders ──────────────────────────────────────────────────────────

  it('GET /reminders — returns reminders for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: validUserId }),
    );
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe(validReminderId);
    expect(response.body[0].user_id).toBe(validUserId);
  });

  it('GET /reminders — applies optional query filters', async () => {
    await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeaderFor('user-token'))
      .query({ subscription_id: validSubId, type: 'subscription_renewal', limit: '20' })
      .expect(200);

    expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        subscriptionId: validSubId,
        type: 'subscription_renewal',
        limit: 20,
      }),
    );
  });

  it('GET /reminders — uses default limit and sort when not specified', async () => {
    await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        limit: 50,
        sort: 'created_at:desc',
      }),
    );
  });

  it('GET /reminders — returns empty array when no reminders', async () => {
    findAllRemindersUseCase.execute.mockResolvedValueOnce([]);

    const response = await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // ─── GET /reminders/:id ──────────────────────────────────────────────────────

  it('GET /reminders/:id — returns reminder by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findReminderByIdUseCase.execute).toHaveBeenCalledWith(validReminderId, validUserId);
    expect(response.body.id).toBe(validReminderId);
  });

  it('GET /reminders/:id — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .get(`/reminders/${validReminderId}`)
      .expect(401);
  });

  // ─── POST /reminders ─────────────────────────────────────────────────────────

  it('POST /reminders — creates a new reminder (201)', async () => {
    const payload = {
      subscription_id: validSubId,
      type: 'subscription_renewal',
      days_before: 7,
      channel: 'email',
    };

    const response = await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(createReminderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        subscriptionId: validSubId,
        type: 'subscription_renewal',
        daysBefore: 7,
        channel: 'email',
        enabled: true,
      }),
    );
    expect(response.body.id).toBe(validReminderId);
    expect(response.body.user_id).toBe(validUserId);
  });

  it('POST /reminders — creates reminder with all optional fields', async () => {
    const payload = {
      subscription_id: validSubId,
      type: 'payment_due',
      days_before: 3,
      enabled: false,
      channel: 'push',
    };

    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(201);

    expect(createReminderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        type: 'payment_due',
        daysBefore: 3,
        enabled: false,
        channel: 'push',
      }),
    );
  });

  it('POST /reminders — 400 when type is missing', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ days_before: 7, channel: 'email' })
      .expect(400);
  });

  it('POST /reminders — 400 when type is invalid enum value', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'unknown_type', days_before: 7, channel: 'email' })
      .expect(400);
  });

  it('POST /reminders — 400 when days_before is missing', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'subscription_renewal', channel: 'email' })
      .expect(400);
  });

  it('POST /reminders — 400 when days_before is below minimum (< 1)', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'subscription_renewal', days_before: 0, channel: 'email' })
      .expect(400);
  });

  it('POST /reminders — 400 when days_before exceeds maximum (> 365)', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'subscription_renewal', days_before: 366, channel: 'email' })
      .expect(400);
  });

  it('POST /reminders — 400 when channel is missing', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'subscription_renewal', days_before: 7 })
      .expect(400);
  });

  it('POST /reminders — 400 when channel is invalid enum value', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeaderFor('user-token'))
      .send({ type: 'subscription_renewal', days_before: 7, channel: 'carrier_pigeon' })
      .expect(400);
  });

  it('POST /reminders — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .post('/reminders')
      .send({ type: 'subscription_renewal', days_before: 7, channel: 'email' })
      .expect(401);
  });

  // ─── PUT /reminders/:id ──────────────────────────────────────────────────────

  it('PUT /reminders/:id — updates reminder (200)', async () => {
    const payload = { days_before: 3 };

    const response = await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(200);

    expect(updateReminderUseCase.execute).toHaveBeenCalledWith(
      validReminderId,
      validUserId,
      expect.objectContaining({ daysBefore: 3 }),
    );
    expect(response.body.id).toBe(validReminderId);
    expect(response.body.days_before).toBe(3);
  });

  it('PUT /reminders/:id — allows partial update with only enabled field', async () => {
    updateReminderUseCase.execute.mockResolvedValueOnce({ ...sampleReminder, enabled: false });

    const response = await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send({ enabled: false })
      .expect(200);

    expect(updateReminderUseCase.execute).toHaveBeenCalledWith(
      validReminderId,
      validUserId,
      expect.objectContaining({ enabled: false }),
    );
    expect(response.body.enabled).toBe(false);
  });

  it('PUT /reminders/:id — allows partial update with only channel field', async () => {
    updateReminderUseCase.execute.mockResolvedValueOnce({ ...sampleReminder, channel: 'sms' });

    await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send({ channel: 'sms' })
      .expect(200);

    expect(updateReminderUseCase.execute).toHaveBeenCalledWith(
      validReminderId,
      validUserId,
      expect.objectContaining({ channel: 'sms' }),
    );
  });

  it('PUT /reminders/:id — 400 when days_before is below minimum', async () => {
    await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send({ days_before: 0 })
      .expect(400);
  });

  it('PUT /reminders/:id — 400 when days_before exceeds maximum', async () => {
    await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send({ days_before: 500 })
      .expect(400);
  });

  it('PUT /reminders/:id — 400 when channel is invalid', async () => {
    await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .send({ channel: 'telegram' })
      .expect(400);
  });

  it('PUT /reminders/:id — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .send({ days_before: 3 })
      .expect(401);
  });

  // ─── DELETE /reminders/:id ───────────────────────────────────────────────────

  it('DELETE /reminders/:id — deletes reminder (204)', async () => {
    await request(app.getHttpServer())
      .delete(`/reminders/${validReminderId}`)
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(deleteReminderUseCase.execute).toHaveBeenCalledWith(validReminderId, validUserId);
  });

  it('DELETE /reminders/:id — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .delete(`/reminders/${validReminderId}`)
      .expect(401);

    expect(deleteReminderUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /reminders/:id — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .delete(`/reminders/${validReminderId}`)
      .set(authHeaderFor('bad-token'))
      .expect(401);

    expect(deleteReminderUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /reminders/:id — passes correct id and userId to use case', async () => {
    const anotherId = '44444444-4444-4444-8444-444444444444';
    deleteReminderUseCase.execute.mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .delete(`/reminders/${anotherId}`)
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(deleteReminderUseCase.execute).toHaveBeenCalledWith(anotherId, validUserId);
  });
});
