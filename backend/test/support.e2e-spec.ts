import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SupportController } from '../src/modules/support/presentation/controllers/support.controller';
import { CreateSupportTicketUseCase } from '../src/modules/support/application/use-cases/create-support-ticket.use-case';
import { ListMySupportTicketsUseCase } from '../src/modules/support/application/use-cases/list-my-support-tickets.use-case';
import { GetMySupportTicketByIdUseCase } from '../src/modules/support/application/use-cases/get-my-support-ticket-by-id.use-case';
import { ReplyToMySupportTicketUseCase } from '../src/modules/support/application/use-cases/reply-to-my-support-ticket.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { SupportTicketCategory } from '../src/modules/support/domain/enums/support-ticket-category.enum';
import { SupportTicketStatus } from '../src/modules/support/domain/enums/support-ticket-status.enum';

const TOKEN_MAP: Record<string, { id: string; role: Role }> = {
  'user-token': { id: 'user-1', role: Role.USER_FREEMIUM },
  'user2-token': { id: 'user-2', role: Role.USER_PREMIUM },
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

describe('Support Module (e2e)', () => {
  let app: INestApplication;

  const createSupportTicketUseCase = { execute: jest.fn() };
  const listMySupportTicketsUseCase = { execute: jest.fn() };
  const getMySupportTicketByIdUseCase = { execute: jest.fn() };
  const replyToMySupportTicketUseCase = { execute: jest.fn() };

  const validTicketId = '11111111-1111-1111-1111-111111111111';
  const validUserId = 'user-1';

  const sampleMessage = {
    id: 'msg-001',
    authorType: 'user',
    body: 'Mes rappels ne se synchronisent plus sur mobile.',
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
  };

  const sampleTicket = {
    id: validTicketId,
    subject: 'Problème de synchronisation',
    status: SupportTicketStatus.OPEN,
    priority: 'medium',
    category: SupportTicketCategory.TECHNICAL,
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
    updatedAt: new Date('2026-04-01T10:00:00.000Z'),
    lastReplyAt: new Date('2026-04-01T10:00:00.000Z'),
    message: sampleMessage,
  };

  const sampleTicketListItem = {
    id: validTicketId,
    subject: 'Problème de synchronisation',
    status: SupportTicketStatus.OPEN,
    category: SupportTicketCategory.TECHNICAL,
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
    lastReplyAt: new Date('2026-04-01T10:00:00.000Z'),
  };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        { provide: CreateSupportTicketUseCase, useValue: createSupportTicketUseCase },
        { provide: ListMySupportTicketsUseCase, useValue: listMySupportTicketsUseCase },
        { provide: GetMySupportTicketByIdUseCase, useValue: getMySupportTicketByIdUseCase },
        { provide: ReplyToMySupportTicketUseCase, useValue: replyToMySupportTicketUseCase },
      ],
    })
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
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createSupportTicketUseCase.execute.mockResolvedValue(sampleTicket);
    listMySupportTicketsUseCase.execute.mockResolvedValue({
      data: [sampleTicketListItem],
      total: 1,
      page: 1,
      limit: 20,
    });
    getMySupportTicketByIdUseCase.execute.mockResolvedValue(sampleTicket);
    replyToMySupportTicketUseCase.execute.mockResolvedValue({
      ok: true,
      ticketId: validTicketId,
      status: SupportTicketStatus.PENDING_USER,
      message: {
        id: 'msg-002',
        authorType: 'user',
        body: 'Merci, voici des précisions.',
        createdAt: new Date('2026-04-01T11:00:00.000Z'),
      },
    });
  });
  describe('GET /support/tickets/categories', () => {
    it('returns the list of ticket categories when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/support/tickets/categories')
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain(SupportTicketCategory.TECHNICAL);
      expect(response.body).toContain(SupportTicketCategory.BILLING);
      expect(response.body).toContain(SupportTicketCategory.BUG);
      expect(response.body.length).toBe(Object.values(SupportTicketCategory).length);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/support/tickets/categories').expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/support/tickets/categories')
        .set(authHeaderFor('bad-token-xyz'))
        .expect(401);
    });
  });
  describe('POST /support/tickets', () => {
    it('creates a support ticket with all fields', async () => {
      const payload = {
        subject: 'Problème de synchronisation',
        message: 'Mes rappels ne se synchronisent plus sur mobile.',
        category: SupportTicketCategory.TECHNICAL,
      };

      const response = await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send(payload)
        .expect(201);

      expect(createSupportTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUserId }),
        expect.objectContaining({
          subject: payload.subject,
          message: payload.message,
          category: payload.category,
        }),
      );
      expect(response.body).toMatchObject({
        id: validTicketId,
        subject: 'Problème de synchronisation',
        status: SupportTicketStatus.OPEN,
      });
    });

    it('creates a ticket without optional category', async () => {
      const response = await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send({
          subject: 'Question générale',
          message: 'Je voudrais savoir comment accéder à mes données.',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('returns 400 for missing subject', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send({ message: 'Un message sans sujet.' })
        .expect(400);
    });

    it('returns 400 for subject too short (< 3 chars)', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send({ subject: 'Hi', message: 'Un message de test suffisamment long.' })
        .expect(400);
    });

    it('returns 400 for missing message', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send({ subject: 'Sujet valide' })
        .expect(400);
    });

    it('returns 400 for invalid category enum value', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('user-token'))
        .send({
          subject: 'Sujet valide',
          message: 'Message valide.',
          category: 'not_a_real_category',
        })
        .expect(400);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .send({ subject: 'Test', message: 'Test message.' })
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .set(authHeaderFor('bad-token'))
        .send({ subject: 'Test', message: 'Test message.' })
        .expect(401);
    });
  });
  describe('GET /support/tickets/me', () => {
    it('returns my tickets list without filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/support/tickets/me')
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(listMySupportTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUserId }),
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('passes status and category filters to use case', async () => {
      await request(app.getHttpServer())
        .get('/support/tickets/me')
        .query({ status: SupportTicketStatus.OPEN, category: SupportTicketCategory.BILLING })
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(listMySupportTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUserId }),
        expect.objectContaining({
          status: SupportTicketStatus.OPEN,
          category: SupportTicketCategory.BILLING,
        }),
      );
    });

    it('passes pagination query params to use case', async () => {
      await request(app.getHttpServer())
        .get('/support/tickets/me')
        .query({ page: '2', limit: '10' })
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(listMySupportTicketsUseCase.execute).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });

    it('returns 400 for invalid status filter', async () => {
      await request(app.getHttpServer())
        .get('/support/tickets/me')
        .query({ status: 'invalid_status' })
        .set(authHeaderFor('user-token'))
        .expect(400);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/support/tickets/me').expect(401);
    });
  });

  describe('GET /support/tickets/:id', () => {
    it('returns ticket details for a valid UUID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/support/tickets/${validTicketId}`)
        .set(authHeaderFor('user-token'))
        .expect(200);

      expect(getMySupportTicketByIdUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUserId }),
        validTicketId,
      );
      expect(response.body).toMatchObject({
        id: validTicketId,
        subject: 'Problème de synchronisation',
      });
    });

    it('propagates NotFoundException as 404 when ticket not found', async () => {
      getMySupportTicketByIdUseCase.execute.mockRejectedValueOnce(
        new NotFoundException('Support ticket not found'),
      );

      await request(app.getHttpServer())
        .get(`/support/tickets/${validTicketId}`)
        .set(authHeaderFor('user-token'))
        .expect(404);
    });

    it('returns 400 for a non-UUID id param', async () => {
      await request(app.getHttpServer())
        .get('/support/tickets/not-a-uuid')
        .set(authHeaderFor('user-token'))
        .expect(400);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer()).get(`/support/tickets/${validTicketId}`).expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/support/tickets/${validTicketId}`)
        .set(authHeaderFor('bogus-token'))
        .expect(401);
    });
  });

  describe('POST /support/tickets/:id/reply', () => {
    it('submits a reply to an existing ticket', async () => {
      const replyBody = { message: 'Merci, voici des précisions supplémentaires.' };

      const response = await request(app.getHttpServer())
        .post(`/support/tickets/${validTicketId}/reply`)
        .set(authHeaderFor('user-token'))
        .send(replyBody)
        .expect(201);

      expect(replyToMySupportTicketUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUserId }),
        validTicketId,
        expect.objectContaining({ message: replyBody.message }),
      );
      expect(response.body).toMatchObject({
        ok: true,
        ticketId: validTicketId,
      });
    });

    it('propagates NotFoundException as 404 when ticket not found', async () => {
      replyToMySupportTicketUseCase.execute.mockRejectedValueOnce(
        new NotFoundException('Support ticket not found'),
      );

      await request(app.getHttpServer())
        .post(`/support/tickets/${validTicketId}/reply`)
        .set(authHeaderFor('user-token'))
        .send({ message: 'Une réponse.' })
        .expect(404);
    });

    it('returns 400 for missing message', async () => {
      await request(app.getHttpServer())
        .post(`/support/tickets/${validTicketId}/reply`)
        .set(authHeaderFor('user-token'))
        .send({})
        .expect(400);
    });

    it('returns 400 for non-UUID id param', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets/not-a-uuid/reply')
        .set(authHeaderFor('user-token'))
        .send({ message: 'Une réponse valide.' })
        .expect(400);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post(`/support/tickets/${validTicketId}/reply`)
        .send({ message: 'Une réponse valide.' })
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post(`/support/tickets/${validTicketId}/reply`)
        .set(authHeaderFor('bad-token'))
        .send({ message: 'Une réponse valide.' })
        .expect(401);
    });
  });
});
