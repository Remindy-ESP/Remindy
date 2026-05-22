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
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';


const EVENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SUB_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTHER_USER_ID = 'other-user-id';

const TOKENS = {
  user: { userId: USER_ID, role: Role.USER_PREMIUM },
  other: { userId: OTHER_USER_ID, role: Role.USER_PREMIUM },
} as const;

const TOKEN_MAP: Record<string, { userId: string; role: Role }> = {
  'user-token': TOKENS.user,
  'other-user-token': TOKENS.other,
};


class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    const token = header.slice(7);
    const payload = TOKEN_MAP[token];

    if (!payload) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    req.user = payload;
    return true;
  }
}

const sampleEvent = {
  id: EVENT_ID,
  subscriptionId: SUB_ID,
  title: 'Netflix Payment',
  notes: 'monthly',
  amount: 15.99,
  startsAt: new Date('2025-02-01T00:00:00Z'),
  endsAt: new Date('2025-02-01T01:00:00Z'),
  status: 'scheduled',
  paymentStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleSubscription = {
  id: SUB_ID,
  userId: USER_ID,
  name: 'Netflix',
  amount: 15.99,
  currency: 'EUR',
  billingCycle: 'monthly',
  status: 'active',
  startDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EventController (e2e)', () => {
  let app: INestApplication;

  const findAllEvents = { execute: jest.fn() };
  const getEventById = { execute: jest.fn() };
  const rescheduleEvent = { execute: jest.fn() };
  const updateStatus = { execute: jest.fn() };
  const updatePayment = { execute: jest.fn() };
  const deleteEvent = { execute: jest.fn() };
  const findSubscription = { findById: jest.fn() };
  const findAllSubscriptions = { execute: jest.fn() };

  const auth = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: FindAllEventsUseCase, useValue: findAllEvents },
        { provide: GetEventByIdUseCase, useValue: getEventById },
        { provide: RescheduleEventUseCase, useValue: rescheduleEvent },
        { provide: UpdateEventStatusUseCase, useValue: updateStatus },
        { provide: UpdateEventPaymentStatusUseCase, useValue: updatePayment },
        { provide: DeleteEventUseCase, useValue: deleteEvent },
        { provide: FindSubscriptionUseCase, useValue: findSubscription },
        { provide: FindAllSubscriptionsUseCase, useValue: findAllSubscriptions },
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

    findAllEvents.execute.mockResolvedValue([sampleEvent]);
    getEventById.execute.mockResolvedValue(sampleEvent);
    rescheduleEvent.execute.mockResolvedValue(sampleEvent);
    updateStatus.execute.mockResolvedValue({ ...sampleEvent, status: 'completed' });
    updatePayment.execute.mockResolvedValue({
      ...sampleEvent,
      paymentStatus: 'paid',
    });
    deleteEvent.execute.mockResolvedValue(undefined);
    findSubscription.findById.mockResolvedValue(sampleSubscription);
    findAllSubscriptions.execute.mockResolvedValue([sampleSubscription]);
  });


  it('GET /calendar/events — 401 without token', async () => {
    await request(app.getHttpServer()).get('/calendar/events').expect(401);
  });

  it('GET /calendar/events — 401 invalid token', async () => {
    await request(app.getHttpServer())
      .get('/calendar/events')
      .set(auth('bad-token'))
      .expect(401);
  });


  it('GET /calendar/events — returns events', async () => {
    const res = await request(app.getHttpServer())
      .get('/calendar/events')
      .set(auth('user-token'))
      .expect(200);

    expect(findAllSubscriptions.execute).toHaveBeenCalledWith({ userId: USER_ID });
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(EVENT_ID);
  });

  it('GET empty when no subscriptions', async () => {
    findAllSubscriptions.execute.mockResolvedValueOnce([]);

    const res = await request(app.getHttpServer())
      .get('/calendar/events')
      .set(auth('user-token'))
      .expect(200);

    expect(res.body).toEqual([]);
  });


  it('GET /event/:id owner', async () => {
    await request(app.getHttpServer())
      .get(`/calendar/event/${EVENT_ID}`)
      .set(auth('user-token'))
      .expect(200);

    expect(getEventById.execute).toHaveBeenCalledWith(EVENT_ID);
  });

  it('GET /event/:id forbidden user', async () => {
    findSubscription.findById.mockResolvedValueOnce({
      ...sampleSubscription,
      userId: 'another-user',
    });

    await request(app.getHttpServer())
      .get(`/calendar/event/${EVENT_ID}`)
      .set(auth('user-token'))
      .expect(404);
  });


  it('PUT reschedule', async () => {
    await request(app.getHttpServer())
      .put(`/calendar/event/${EVENT_ID}/reschedule`)
      .set(auth('user-token'))
      .send({
        starts_at: '2025-03-01T10:00:00Z',
        ends_at: '2025-03-01T11:00:00Z',
      })
      .expect(200);

    expect(rescheduleEvent.execute).toHaveBeenCalled();
  });


  it('PATCH status', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${EVENT_ID}/status`)
      .set(auth('user-token'))
      .send({ status: 'completed' })
      .expect(200);

    expect(updateStatus.execute).toHaveBeenCalledWith(EVENT_ID, 'completed');
  });


  it('PATCH payment status', async () => {
    await request(app.getHttpServer())
      .patch(`/calendar/event/${EVENT_ID}/payment-status`)
      .set(auth('user-token'))
      .send({ paymentStatus: 'paid' })
      .expect(200);

    expect(updatePayment.execute).toHaveBeenCalledWith(EVENT_ID, 'paid');
  });


  it('DELETE event', async () => {
    await request(app.getHttpServer())
      .delete(`/calendar/event/${EVENT_ID}`)
      .set(auth('user-token'))
      .expect(204);

    expect(deleteEvent.execute).toHaveBeenCalledWith(EVENT_ID);
  });
});