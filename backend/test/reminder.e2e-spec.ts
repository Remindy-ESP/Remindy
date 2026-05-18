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

import { ReminderController } from '../src/modules/reminder/presentation/controllers/reminder.controller';

import { FindAllRemindersUseCase } from '../src/modules/reminder/application/use-cases/find-all-reminders.use-case';
import { FindReminderByIdUseCase } from '../src/modules/reminder/application/use-cases/find-reminder-by-id.use-case';
import { CreateReminderUseCase } from '../src/modules/reminder/application/use-cases/create-reminder.use-case';
import { UpdateReminderUseCase } from '../src/modules/reminder/application/use-cases/update-reminder.use-case';
import { DeleteReminderUseCase } from '../src/modules/reminder/application/use-cases/delete-reminder.use-case';

import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';


const validReminderId = '11111111-1111-4111-8111-111111111111';
const validSubId = '22222222-2222-4222-8222-222222222222';
const validUserId = '33333333-3333-4333-8333-333333333333';

const TOKEN_MAP: Record<string, { userId: string; role: Role }> = {
  'user-token': { userId: validUserId, role: Role.USER_PREMIUM },
};

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers?.authorization;

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


const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

async function expectUnauthorized(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
): Promise<void> {
  await request(app.getHttpServer())[method](url).expect(401);
}

describe('ReminderController (e2e)', () => {
  let app: INestApplication;

  const findAllRemindersUseCase = { execute: jest.fn() };
  const findReminderByIdUseCase = { execute: jest.fn() };
  const createReminderUseCase = { execute: jest.fn() };
  const updateReminderUseCase = { execute: jest.fn() };
  const deleteReminderUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReminderController],
      providers: [
        { provide: FindAllRemindersUseCase, useValue: findAllRemindersUseCase },
        { provide: FindReminderByIdUseCase, useValue: findReminderByIdUseCase },
        { provide: CreateReminderUseCase, useValue: createReminderUseCase },
        { provide: UpdateReminderUseCase, useValue: updateReminderUseCase },
        { provide: DeleteReminderUseCase, useValue: deleteReminderUseCase },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtAuthGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    findAllRemindersUseCase.execute.mockResolvedValue([sampleReminder]);
    findReminderByIdUseCase.execute.mockResolvedValue(sampleReminder);
    createReminderUseCase.execute.mockResolvedValue(sampleReminder);
    updateReminderUseCase.execute.mockResolvedValue({ ...sampleReminder, daysBefore: 3 });
    deleteReminderUseCase.execute.mockResolvedValue(undefined);
  });

  it('GET /reminders — 401 sans token', async () => {
    await expectUnauthorized(app, 'get', '/reminders');
  });

  it('GET /reminders — 401 token invalide', async () => {
    await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeader('bad-token'))
      .expect(401);
  });

  it('GET /reminders — OK', async () => {
    const res = await request(app.getHttpServer())
      .get('/reminders')
      .set(authHeader('user-token'))
      .expect(200);

    expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: validUserId }),
    );
    expect(res.body[0].id).toBe(validReminderId);
  });

  it('GET /reminders/:id — OK', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reminders/${validReminderId}`)
      .set(authHeader('user-token'))
      .expect(200);

    expect(findReminderByIdUseCase.execute).toHaveBeenCalledWith(validReminderId, validUserId);
    expect(res.body.id).toBe(validReminderId);
  });

  it('POST /reminders — create', async () => {
    const payload = {
      subscription_id: validSubId,
      type: 'subscription_renewal',
      days_before: 7,
      channel: 'email',
    };

    const res = await request(app.getHttpServer())
      .post('/reminders')
      .set(authHeader('user-token'))
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
    expect(res.body.id).toBe(validReminderId);
  });

  it('PUT /reminders/:id — update', async () => {
    const res = await request(app.getHttpServer())
      .put(`/reminders/${validReminderId}`)
      .set(authHeader('user-token'))
      .send({ days_before: 3 })
      .expect(200);

    expect(updateReminderUseCase.execute).toHaveBeenCalledWith(
      validReminderId,
      validUserId,
      expect.objectContaining({ daysBefore: 3 }),
    );
    expect(res.body.days_before).toBe(3);
  });

  it('DELETE /reminders/:id — delete', async () => {
    await request(app.getHttpServer())
      .delete(`/reminders/${validReminderId}`)
      .set(authHeader('user-token'))
      .expect(204);

    expect(deleteReminderUseCase.execute).toHaveBeenCalledWith(validReminderId, validUserId);
  });

  it('DELETE /reminders/:id — 401 sans token', async () => {
    await expectUnauthorized(app, 'delete', `/reminders/${validReminderId}`);

    expect(deleteReminderUseCase.execute).not.toHaveBeenCalled();
  });
});