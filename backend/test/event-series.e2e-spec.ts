import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';

import { EventSeriesController } from '../src/modules/event-series/presentation/controllers/event-series.controller';
import { CreateEventSeriesUseCase } from '../src/modules/event-series/application/use-cases/create-event-series.use-case';
import { FindEventSeriesBySubscriptionUseCase } from '../src/modules/event-series/application/use-cases/find-event-series-by-subscription.use-case';
import { GenerateEventsFromSeriesUseCase } from '../src/modules/event-series/application/use-cases/generate-events-from-series.use-case';
import { FindSubscriptionUseCase } from '../src/modules/subscription/application/use-cases/find-subscription.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

const VALID_SERIES_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const VALID_SUBSCRIPTION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const VALID_USER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const TOKEN_MAP: Record<string, { userId: string; role: Role }> = {
  'user-token': {
    userId: VALID_USER_ID,
    role: Role.USER_PREMIUM,
  },
  'other-user-token': {
    userId: 'other-user-id',
    role: Role.USER_PREMIUM,
  },
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

const sampleSeries = {
  id: VALID_SERIES_ID,
  subscriptionId: VALID_SUBSCRIPTION_ID,
  rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
  dtstart: new Date('2025-01-15T00:00:00Z'),
  timezone: 'Europe/Paris',
  exdates: [],
  rdates: [],
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const sampleSubscription = {
  id: VALID_SUBSCRIPTION_ID,
  userId: VALID_USER_ID,
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
  subscriptionId: VALID_SUBSCRIPTION_ID,
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

  const createEventSeriesUseCase = {
    execute: jest.fn(),
  };

  const findBySubscriptionUseCase = {
    execute: jest.fn(),
  };

  const generateEventsUseCase = {
    execute: jest.fn(),
  };

  const findSubscriptionUseCase = {
    findById: jest.fn(),
  };

  const authHeaderFor = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  const validPayload = {
    subscriptionId: VALID_SUBSCRIPTION_ID,
    rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
    dtstart: '2025-01-15T00:00:00Z',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventSeriesController],
      providers: [
        {
          provide: CreateEventSeriesUseCase,
          useValue: createEventSeriesUseCase,
        },
        {
          provide: FindEventSeriesBySubscriptionUseCase,
          useValue: findBySubscriptionUseCase,
        },
        {
          provide: GenerateEventsFromSeriesUseCase,
          useValue: generateEventsUseCase,
        },
        {
          provide: FindSubscriptionUseCase,
          useValue: findSubscriptionUseCase,
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
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createEventSeriesUseCase.execute.mockResolvedValue(sampleSeries);

    findBySubscriptionUseCase.execute.mockResolvedValue(sampleSeries);

    generateEventsUseCase.execute.mockResolvedValue([sampleOccurrence]);

    findSubscriptionUseCase.findById.mockResolvedValue(sampleSubscription);
  });

  describe('POST /event-series', () => {
    it.each([
      ['without token', undefined],
      ['with invalid token', 'bad-token'],
    ])('returns 401 %s', async (_, token) => {
      const req = request(app.getHttpServer())
        .post('/event-series')
        .send(validPayload);

      if (token) {
        req.set(authHeaderFor(token));
      }

      await req.expect(401);
    });

    it('creates a new event series', async () => {
      const payload = {
        ...validPayload,
        timezone: 'Europe/Paris',
      };

      const response = await request(app.getHttpServer())
        .post('/event-series')
        .set(authHeaderFor('user-token'))
        .send(payload)
        .expect(201);

      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(
        VALID_SUBSCRIPTION_ID,
      );

      expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: VALID_SUBSCRIPTION_ID,
          rrule: payload.rrule,
          dtstart: new Date(payload.dtstart),
          timezone: payload.timezone,
        }),
      );

      expect(response.body).toMatchObject({
        id: VALID_SERIES_ID,
        subscriptionId: VALID_SUBSCRIPTION_ID,
        rrule: payload.rrule,
      });
    });

    it('creates a series with exdates and rdates', async () => {
      await request(app.getHttpServer())
        .post('/event-series')
        .set(authHeaderFor('user-token'))
        .send({
          ...validPayload,
          exdates: ['2025-08-15T00:00:00Z'],
          rdates: ['2025-03-21T00:00:00Z'],
        })
        .expect(201);

      expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          exdates: [new Date('2025-08-15T00:00:00Z')],
          rdates: [new Date('2025-03-21T00:00:00Z')],
        }),
      );
    });

    it.each([
      [
        'missing subscriptionId',
        {
          rrule: validPayload.rrule,
          dtstart: validPayload.dtstart,
        },
      ],
      [
        'missing rrule',
        {
          subscriptionId: VALID_SUBSCRIPTION_ID,
          dtstart: validPayload.dtstart,
        },
      ],
      [
        'missing dtstart',
        {
          subscriptionId: VALID_SUBSCRIPTION_ID,
          rrule: validPayload.rrule,
        },
      ],
      [
        'invalid dtstart',
        {
          ...validPayload,
          dtstart: 'not-a-date',
        },
      ],
    ])('returns 400 for %s', async (_, payload) => {
      await request(app.getHttpServer())
        .post('/event-series')
        .set(authHeaderFor('user-token'))
        .send(payload)
        .expect(400);
    });

    it('returns 404 when subscription belongs to another user', async () => {
      findSubscriptionUseCase.findById.mockResolvedValueOnce({
        ...sampleSubscription,
        userId: 'another-user',
      });

      await request(app.getHttpServer())
        .post('/event-series')
        .set(authHeaderFor('user-token'))
        .send(validPayload)
        .expect(404);

      expect(createEventSeriesUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /event-series/subscription/:subscriptionId', () => {
    it('returns the series for the subscription owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/event-series/subscription/${VALID_SUBSCRIPTION_ID}`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith(
        VALID_SUBSCRIPTION_ID,
      );

      expect(findBySubscriptionUseCase.execute).toHaveBeenCalledWith(
        VALID_SUBSCRIPTION_ID,
      );

      expect(response.body).toMatchObject({
        id: VALID_SERIES_ID,
        subscriptionId: VALID_SUBSCRIPTION_ID,
      });
    });

    it('returns 404 when subscription belongs to another user', async () => {
      findSubscriptionUseCase.findById.mockResolvedValueOnce({
        ...sampleSubscription,
        userId: 'another-user',
      });

      await request(app.getHttpServer())
        .get(`/event-series/subscription/${VALID_SUBSCRIPTION_ID}`)
        .set(authHeaderFor('user-token'))
        .expect(404);

      expect(findBySubscriptionUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/event-series/subscription/${VALID_SUBSCRIPTION_ID}`)
        .expect(401);
    });
  });

  describe('GET /event-series/:id/generate', () => {
    it('returns generated occurrences', async () => {
      const response = await request(app.getHttpServer())
        .get(`/event-series/${VALID_SERIES_ID}/generate`)
        .set(authHeaderFor('user-token'))
        .query({
          start: '2025-01-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
          max: 12,
        })
        .expect(200);

      expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
        VALID_SERIES_ID,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z'),
        12,
      );

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('uses default query values', async () => {
      await request(app.getHttpServer())
        .get(`/event-series/${VALID_SERIES_ID}/generate`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
        VALID_SERIES_ID,
        expect.any(Date),
        expect.any(Date),
        365,
      );
    });

    it('returns empty array when no occurrences are generated', async () => {
      generateEventsUseCase.execute.mockResolvedValueOnce([]);

      const response = await request(app.getHttpServer())
        .get(`/event-series/${VALID_SERIES_ID}/generate`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(response.body).toEqual([]);

      expect(findSubscriptionUseCase.findById).not.toHaveBeenCalled();
    });

    it('returns 404 when occurrences belong to another user', async () => {
      findSubscriptionUseCase.findById.mockResolvedValueOnce({
        ...sampleSubscription,
        userId: 'another-user',
      });

      await request(app.getHttpServer())
        .get(`/event-series/${VALID_SERIES_ID}/generate`)
        .set(authHeaderFor('user-token'))
        .expect(404);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/event-series/${VALID_SERIES_ID}/generate`)
        .expect(401);
    });
  });
});