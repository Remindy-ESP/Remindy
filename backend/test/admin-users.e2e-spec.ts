import 'reflect-metadata';
import {
  CallHandler,
  ExecutionContext,
  INestApplication,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { of } from 'rxjs';

jest.mock('../src/modules/admin/presentation/decorators/admin.decorator', () => ({
  Admin: () => () => undefined,
}));

jest.mock('../src/modules/audit/presentation/decorators/audit.decorator', () => ({
  Audit: () => () => undefined,
  AUDIT_METADATA_KEY: 'audit',
}));

jest.mock('../src/modules/audit/presentation/interceptors/audit.interceptor', () => {
  class NoopAuditInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler) {
      return next.handle ? next.handle() : of(null);
    }
  }

  return {
    AuditInterceptor: NoopAuditInterceptor,
  };
});

import { AdminUsersController } from '../src/modules/admin/presentation/controllers/admin-users.controller';
import { AdminUsersService } from '../src/modules/admin/application/admin-users.service';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

describe('AdminUsersController (e2e)', () => {
  let app: INestApplication;

  const adminUsersServiceMock = {
    list: jest.fn(),
    getById: jest.fn(),
    ban: jest.fn(),
    unban: jest.fn(),
    verifyEmail: jest.fn(),
    forceMfa: jest.fn(),
    revokeSessions: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: adminUsersServiceMock,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    app.use((req: any, _res: any, next: () => void) => {
      req.user = {
        id: 'admin-1',
        role: Role.SUPER_ADMIN,
      };

      Object.defineProperty(req, 'ip', {
        configurable: true,
        enumerable: true,
        get: () => '127.0.0.1',
      });

      const originalGet = req.get?.bind(req);

      req.get = (header: string) => {
        if (header.toLowerCase() === 'user-agent') {
          return 'e2e-test-agent';
        }
        return originalGet ? originalGet(header) : undefined;
      };

      next();
    });

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /admin/users returns paginated users', async () => {
    adminUsersServiceMock.list.mockResolvedValue({
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john@doe.dev',
          firstName: 'John',
          lastName: 'Doe',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .query({
        page: 1,
        limit: 20,
        q: 'john',
      })
      .expect(200);

    expect(adminUsersServiceMock.list).toHaveBeenCalledWith(
      {
        id: 'admin-1',
        role: Role.SUPER_ADMIN,
      },
      {
        q: 'john',
        status: undefined,
        role: undefined,
        emailVerified: undefined,
        mfaEnabled: undefined,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      },
    );

    expect(res.body).toEqual({
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john@doe.dev',
          firstName: 'John',
          lastName: 'Doe',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('GET /admin/users/:id returns 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/admin/users/not-a-uuid').expect(400);

    expect(adminUsersServiceMock.getById).not.toHaveBeenCalled();
  });

  it('POST /admin/users/:id/ban bans a user', async () => {
    adminUsersServiceMock.ban.mockResolvedValue({ ok: true });

    const res = await request(app.getHttpServer())
      .post('/admin/users/550e8400-e29b-41d4-a716-446655440000/ban')
      .send({ reason: 'fraud' })
      .expect(201);

    expect(adminUsersServiceMock.ban).toHaveBeenCalledWith(
      {
        id: 'admin-1',
        role: Role.SUPER_ADMIN,
      },
      '550e8400-e29b-41d4-a716-446655440000',
      'fraud',
      {
        ipAddress: '127.0.0.1',
        userAgent: 'e2e-test-agent',
      },
    );

    expect(res.body).toEqual({ ok: true });
  });

  it('POST /admin/users/:id/ban returns 400 for invalid uuid', async () => {
    await request(app.getHttpServer())
      .post('/admin/users/not-a-uuid/ban')
      .send({ reason: 'fraud' })
      .expect(400);

    expect(adminUsersServiceMock.ban).not.toHaveBeenCalled();
  });
});
