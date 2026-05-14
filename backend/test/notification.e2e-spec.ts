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

import { NotificationController } from '../src/modules/notification/presentation/controllers/notification.controller';

import { FindAllNotificationsUseCase } from '../src/modules/notification/application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../src/modules/notification/application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../src/modules/notification/application/use-cases/mark-notification-as-read.use-case';
import { ExpoPushService } from '../src/modules/notification/application/services/expo-push.service';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

const validNotificationId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const validUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const TOKEN_MAP: Record<string, { userId: string; role: Role }> = {
  'user-token': { userId: validUserId, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    const token = authHeader.slice(7);
    const payload = TOKEN_MAP[token];

    if (!payload) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    req.user = payload;
    return true;
  }
}

const sampleNotification = {
  id: validNotificationId,
  userId: validUserId,
  eventId: 'event-id-1',
  reminderId: 'reminder-id-1',
  type: 'reminder',
  channel: 'push',
  title: 'Paiement Netflix dans 3 jours',
  body: 'Votre abonnement Netflix de 15.99€ sera débité',
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
  const expoPushService = { registerToken: jest.fn(), unregisterToken: jest.fn() };

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: FindAllNotificationsUseCase, useValue: findAllNotificationsUseCase },
        { provide: SnoozeNotificationUseCase, useValue: snoozeNotificationUseCase },
        { provide: MarkNotificationAsReadUseCase, useValue: markNotificationAsReadUseCase },
        { provide: ExpoPushService, useValue: expoPushService },
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
  });


  it('GET /notifications — 401 sans token', async () => {
    await request(app.getHttpServer()).get('/notifications').expect(401);
  });

  it('GET /notifications — 401 token invalide', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeader('bad-token'))
      .expect(401);
  });

  it('GET /notifications — OK', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeader('user-token'))
      .expect(200);

    expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: validUserId }),
    );

    expect(res.body[0].id).toBe(validNotificationId);
  });

  it('GET /notifications — filters query', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeader('user-token'))
      .query({
        type: 'reminder',
        channel: 'push',
        status: 'sent',
        is_read: 'false',
        limit: '10',
      })
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

  it('GET /notifications — default pagination', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeader('user-token'))
      .expect(200);

    expect(findAllNotificationsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: validUserId,
        limit: 50,
        sort: 'created_at:desc',
      }),
    );
  });


  it('PUT /notifications/:id/snooze — OK', async () => {
    const payload = { snoozed_until: '2025-11-10T10:00:00Z' };

    const res = await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeader('user-token'))
      .send(payload)
      .expect(200);

    expect(snoozeNotificationUseCase.execute).toHaveBeenCalledWith(
      validNotificationId,
      validUserId,
      expect.objectContaining({
        snoozedUntil: new Date(payload.snoozed_until),
      }),
    );

    expect(res.body.status).toBe('snoozed');
  });

  it('PUT /notifications/:id/snooze — 400 invalid payload', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .set(authHeader('user-token'))
      .send({})
      .expect(400);
  });

  it('PUT /notifications/:id/snooze — 401 no token', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/snooze`)
      .send({ snoozed_until: '2025-11-10T10:00:00Z' })
      .expect(401);
  });


  it('PUT /notifications/:id/mark-read — OK', async () => {
    const res = await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/mark-read`)
      .set(authHeader('user-token'))
      .expect(200);

    expect(markNotificationAsReadUseCase.execute).toHaveBeenCalledWith(
      validNotificationId,
      validUserId,
    );

    expect(res.body.read_at).toBeDefined();
  });

  it('PUT /notifications/:id/mark-read — 401 no token', async () => {
    await request(app.getHttpServer())
      .put(`/notifications/${validNotificationId}/mark-read`)
      .expect(401);

    expect(markNotificationAsReadUseCase.execute).not.toHaveBeenCalled();
  });
});