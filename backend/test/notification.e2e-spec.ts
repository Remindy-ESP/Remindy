import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

import { NotificationController } from '../src/modules/notification/presentation/controllers/notification.controller';
import { FindAllNotificationsUseCase } from '../src/modules/notification/application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../src/modules/notification/application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../src/modules/notification/application/use-cases/mark-notification-as-read.use-case';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';

const validNotificationId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const validUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const sampleNotification = {
  id: validNotificationId,
  userId: validUserId,
  eventId: 'event-id-1',
  reminderId: 'reminder-id-1',
  type: 'reminder',
  channel: 'push',
  title: 'Paiement Netflix dans 3 jours',
  body: 'Votre abonnement Netflix de 15.99€ sera débité le 15 novembre',
  sentAt: new Date('2025-11-06T15:30:00Z'),
  readAt: undefined,
  status: 'sent',
  snoozedUntil: undefined,
  errorMessage: undefined,
  metadata: { message_id: 'msg_abc123' },
  createdAt: new Date('2025-11-06T15:00:00Z'),
  deletedAt: undefined,
};

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  const findAllNotificationsUseCase = { execute: jest.fn() };
  const snoozeNotificationUseCase = { execute: jest.fn() };
  const markNotificationAsReadUseCase = { execute: jest.fn() };

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
      controllers: [NotificationController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: FindAllNotificationsUseCase, useValue: findAllNotificationsUseCase },
        { provide: SnoozeNotificationUseCase, useValue: snoozeNotificationUseCase },
        { provide: MarkNotificationAsReadUseCase, useValue: markNotificationAsReadUseCase },
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

    findAllNotificationsUseCase.execute.mockResolvedValue([sampleNotification]);
    snoozeNotificationUseCase.execute.mockResolvedValue({
      ...sampleNotification,
      status: 'snoozed',
      snoozedUntil: new Date('2025-11-10T10:00:00Z'),
    });
    markNotificationAsReadUseCase.execute.mockResolvedValue({
      ...sampleNotification,
      readAt: new Date('2025-11-06T16:00:00Z'),
    });

    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'user-token') return { sub: validUserId, role: Role.USER_PREMIUM };
      throw new Error('invalid token');
    });
  });

  // ─── Authentication ──────────────────────────────────────────────────────────

  it('GET /notifications — 401 when no token provided', async () => {
    await request(app.getHttpServer()).get('/notifications').expect(401);
  });

  it('GET /notifications — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeaderFor('bad-token'))
      .expect(401);
  });

  // ─── GET /notifications ──────────────────────────────────────────────────────

  it('GET /notifications — returns notifications for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: validUserId }),
    );
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe(validNotificationId);
    expect(response.body[0].user_id).toBe(validUserId);
  });

  it('GET /notifications — applies query filters', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeaderFor('user-token'))
      .query({ type: 'reminder', channel: 'push', status: 'sent', is_read: 'false', limit: '10' })
      .expect(200);

    expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        type: 'reminder',
        channel: 'push',
        status: 'sent',
        limit: 10,
      }),
    );
  });

  it('GET /notifications — uses default limit and sort when not specified', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        limit: 50,
        sort: 'created_at:desc',
      }),
    );
  });

  it('GET /notifications — returns empty array when no notifications', async () => {
    findAllNotificationsUseCase.execute.mockResolvedValueOnce([]);

    const response = await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // ─── PUT /notifications/:id/snooze ──────────────────────────────────────────

  it('PUT /notifications/:id/snooze — snoozes notification with future date', async () => {
    const payload = { snoozed_until: '2025-11-10T10:00:00Z' };

    const response = await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeaderFor('user-token'))
      .send(payload)
      .expect(200);

    expect(snoozeNotificationUseCase.execute).toHaveBeenCalledWith(
      validNotificationId,
      validUserId,
      expect.objectContaining({ snoozedUntil: new Date(payload.snoozed_until) }),
    );
    expect(response.body.id).toBe(validNotificationId);
    expect(response.body.status).toBe('snoozed');
  });

  it('PUT /notifications/:id/snooze — 400 when snoozed_until is missing', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeaderFor('user-token'))
      .send({})
      .expect(400);
  });

  it('PUT /notifications/:id/snooze — 400 when snoozed_until is not a valid date string', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeaderFor('user-token'))
      .send({ snoozed_until: 'not-a-date' })
      .expect(400);
  });

  it('PUT /notifications/:id/snooze — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .send({ snoozed_until: '2025-11-10T10:00:00Z' })
      .expect(401);
  });

  it('PUT /notifications/:id/snooze — 400 when extra unknown fields are sent (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeaderFor('user-token'))
      .send({ snoozed_until: '2025-11-10T10:00:00Z', unknownField: 'bad' })
      .expect(400);
  });

  // ─── PUT /notifications/:id/mark-read ───────────────────────────────────────

  it('PUT /notifications/:id/mark-read — marks notification as read', async () => {
    const response = await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/mark-read`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(markNotificationAsReadUseCase.execute).toHaveBeenCalledWith(
      validNotificationId,
      validUserId,
    );
    expect(response.body.id).toBe(validNotificationId);
    expect(response.body.read_at).toBeDefined();
  });

  it('PUT /notifications/:id/mark-read — 401 when no token provided', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/mark-read`)
      .expect(401);

    expect(markNotificationAsReadUseCase.execute).not.toHaveBeenCalled();
  });

  it('PUT /notifications/:id/mark-read — 401 when invalid token provided', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/mark-read`)
      .set(authHeaderFor('bad-token'))
      .expect(401);

    expect(markNotificationAsReadUseCase.execute).not.toHaveBeenCalled();
  });

  it('PUT /notifications/:id/mark-read — passes notification id from route param', async () => {
    const anotherId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    markNotificationAsReadUseCase.execute.mockResolvedValueOnce({
      ...sampleNotification,
      id: anotherId,
      readAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .put(`/notifications/${anotherId}/mark-read`)
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(markNotificationAsReadUseCase.execute).toHaveBeenCalledWith(anotherId, validUserId);
    expect(response.body.id).toBe(anotherId);
  });
});
