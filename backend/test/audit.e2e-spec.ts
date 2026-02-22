import {
  Body,
  Controller,
  Get,
  INestApplication,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditController } from '../src/modules/audit/presentation/controllers/audit.controller';
import { AuditInterceptor } from '../src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from '../src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from '../src/modules/audit/domain/enums/severity.enum';
import { MfaRequiredGuard } from '../src/modules/audit/presentation/guards/mfa-required.guard';
import { CreateAuditLogUseCase } from '../src/modules/audit/application/use-cases/create-audit-log.use-case';
import { FindAllAuditLogsUseCase } from '../src/modules/audit/application/use-cases/find-all-audit-logs.use-case';
import { FindAuditLogByIdUseCase } from '../src/modules/audit/application/use-cases/find-audit-log-by-id.use-case';
import { GetAuditStatsUseCase } from '../src/modules/audit/application/use-cases/get-audit-stats.use-case';
import { ExportAuditLogsUseCase } from '../src/modules/audit/application/use-cases/export-audit-logs.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Roles } from '../src/modules/auth/presentation/decorators/roles.decorator';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';

type UserRecord = {
  id: string;
  role: Role;
  mfaEnabled: boolean;
};

@Controller('__test/audit-auto')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER_ADMIN, Role.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
class TestAuditAutoController {
  @Post(':id/success')
  @Audit({
    action: 'test.auto.success',
    resourceType: 'test_resource',
    resourceIdParam: 'id',
    severity: Severity.INFO,
  })
  success(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return {
      id,
      ...body,
      token: 'should-be-redacted',
      nested: {
        ...(typeof body.nested === 'object' && body.nested ? body.nested : {}),
        password: 'hidden',
      },
    };
  }

  @Post(':id/fail')
  @Audit({
    action: 'test.auto.fail',
    resourceType: 'test_resource',
    resourceIdParam: 'id',
    severity: Severity.WARNING,
  })
  fail() {
    throw new UnauthorizedException('forced error');
  }

  @Get('plain')
  plain() {
    return { ok: true };
  }
}

describe('Audit Module (e2e)', () => {
  let app: INestApplication;

  const users: Record<string, UserRecord> = {
    'admin-1': { id: 'admin-1', role: Role.USER_ADMIN, mfaEnabled: true },
    'admin-no-mfa': { id: 'admin-no-mfa', role: Role.USER_ADMIN, mfaEnabled: false },
    'user-1': { id: 'user-1', role: Role.USER_PREMIUM, mfaEnabled: true },
  };

  const createAuditLogUseCase = {
    execute: jest.fn(),
  };
  const findAllAuditLogsUseCase = {
    execute: jest.fn(),
  };
  const findAuditLogByIdUseCase = {
    execute: jest.fn(),
  };
  const getAuditStatsUseCase = {
    execute: jest.fn(),
  };
  const exportAuditLogsUseCase = {
    execute: jest.fn(),
  };
  const jwtTokenService = {
    verifyAccessToken: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };

  const validAuditId = '11111111-1111-1111-1111-111111111111';
  const validActorId = '22222222-2222-2222-2222-222222222222';

  const sampleAuditLog = {
    id: validAuditId,
    actorUserId: validActorId,
    action: 'user.update',
    resourceType: 'user',
    resourceId: validActorId,
    before: { profile: { email: 'before@example.com', flags: ['a'] } },
    after: { profile: { email: 'after@example.com', flags: ['a', 'b'] } },
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    severity: Severity.INFO,
    success: true,
    errorMessage: null,
    createdAt: new Date('2026-02-22T12:00:00.000Z'),
  };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      switch (token) {
        case 'admin-token':
          return { sub: 'admin-1', role: Role.USER_ADMIN };
        case 'admin-no-mfa-token':
          return { sub: 'admin-no-mfa', role: Role.USER_ADMIN };
        case 'user-token':
          return { sub: 'user-1', role: Role.USER_PREMIUM };
        default:
          throw new Error('invalid token');
      }
    });

    userRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      const user = users[where.id];
      if (!user) {
        return null;
      }

      return Promise.resolve({
        id: user.id,
        mfaEnabled: user.mfaEnabled,
      });
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuditController, TestAuditAutoController],
      providers: [
        Reflector,
        AuditInterceptor,
        JwtAuthGuard,
        RolesGuard,
        MfaRequiredGuard,
        { provide: CreateAuditLogUseCase, useValue: createAuditLogUseCase },
        { provide: FindAllAuditLogsUseCase, useValue: findAllAuditLogsUseCase },
        { provide: FindAuditLogByIdUseCase, useValue: findAuditLogByIdUseCase },
        { provide: GetAuditStatsUseCase, useValue: getAuditStatsUseCase },
        { provide: ExportAuditLogsUseCase, useValue: exportAuditLogsUseCase },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
      ],
    }).compile();

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

    createAuditLogUseCase.execute.mockResolvedValue(sampleAuditLog);
    findAllAuditLogsUseCase.execute.mockResolvedValue({
      data: [sampleAuditLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    findAuditLogByIdUseCase.execute.mockResolvedValue(sampleAuditLog);
    getAuditStatsUseCase.execute.mockResolvedValue({
      totalLogs: 1,
      logsPerDay: [{ date: '2026-02-22', count: 1 }],
      topActions: [{ action: 'user.update', count: 1 }],
      failureRate: 0,
      bySeverity: [{ severity: Severity.INFO, count: 1 }],
      byResourceType: [{ resourceType: 'user', count: 1 }],
    });
    exportAuditLogsUseCase.execute.mockResolvedValue({
      data: JSON.stringify([sampleAuditLog]),
      contentType: 'application/json; charset=utf-8',
    });
  });

  it('creates a manual audit log with nested JSONB payloads', async () => {
    const payload = {
      action: 'user.update',
      resourceType: 'user',
      resourceId: validActorId,
      before: { profile: { email: 'before@example.com', nested: { active: true } } },
      after: { profile: { email: 'after@example.com', nested: { active: false } } },
      severity: Severity.WARNING,
      success: true,
    };

    const response = await request(app.getHttpServer())
      .post('/audit/create')
      .set(authHeaderFor('admin-token'))
      .set('x-forwarded-for', '203.0.113.10')
      .set('user-agent', 'audit-e2e')
      .send(payload)
      .expect(201);

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: payload.action,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        before: payload.before,
        after: payload.after,
        ipAddress: '203.0.113.10',
        userAgent: 'audit-e2e',
        severity: Severity.WARNING,
        success: true,
      }),
    );
    expect(response.body).toMatchObject({
      id: validAuditId,
      before: sampleAuditLog.before,
      after: sampleAuditLog.after,
    });
  });

  it('returns 403 for non-admin user on audit routes (RBAC)', async () => {
    await request(app.getHttpServer())
      .post('/audit/create')
      .set(authHeaderFor('user-token'))
      .send({
        action: 'user.update',
        resourceType: 'user',
      })
      .expect(403);
  });

  it('returns 403 on MFA-protected route when MFA is disabled', async () => {
    await request(app.getHttpServer())
      .get('/audit/logs')
      .set(authHeaderFor('admin-no-mfa-token'))
      .expect(403);
  });

  it('lists audit logs with filters and preserves nested before/after payloads', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit/logs')
      .query({
        action: 'user.update',
        success: 'true',
        search: 'after@example.com',
        page: '2',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
      .set(authHeaderFor('admin-token'))
      .expect(200);

    expect(findAllAuditLogsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.update',
        success: true,
        search: 'after@example.com',
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }),
    );
    expect(response.body.data[0].before).toEqual(sampleAuditLog.before);
    expect(response.body.data[0].after).toEqual(sampleAuditLog.after);
  });

  it('returns audit log details', async () => {
    const response = await request(app.getHttpServer())
      .get(`/audit/logs/${validAuditId}`)
      .set(authHeaderFor('admin-token'))
      .expect(200);

    expect(findAuditLogByIdUseCase.execute).toHaveBeenCalledWith(validAuditId);
    expect(response.body.id).toBe(validAuditId);
    expect(response.body.after).toEqual(sampleAuditLog.after);
  });

  it('returns audit stats dashboard data', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit/stats')
      .query({
        dateFrom: '2026-02-01T00:00:00.000Z',
        dateTo: '2026-02-22T23:59:59.999Z',
      })
      .set(authHeaderFor('admin-token'))
      .expect(200);

    expect(getAuditStatsUseCase.execute).toHaveBeenCalledWith({
      dateFrom: new Date('2026-02-01T00:00:00.000Z'),
      dateTo: new Date('2026-02-22T23:59:59.999Z'),
    });
    expect(response.body.totalLogs).toBe(1);
  });

  it('exports audit logs as JSON', async () => {
    exportAuditLogsUseCase.execute.mockResolvedValueOnce({
      data: JSON.stringify([sampleAuditLog]),
      contentType: 'application/json; charset=utf-8',
    });

    const response = await request(app.getHttpServer())
      .get('/audit/export')
      .query({ format: 'json', search: 'after@example.com', success: 'true' })
      .set(authHeaderFor('admin-token'))
      .expect(200);

    expect(exportAuditLogsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'json',
        search: 'after@example.com',
        success: true,
      }),
    );
    expect(response.headers['content-disposition']).toContain('.json"');
    expect(response.headers['content-type']).toContain('application/json');
  });

  it('exports audit logs as CSV', async () => {
    exportAuditLogsUseCase.execute.mockResolvedValueOnce({
      data: 'id,action\n1,user.update\n',
      contentType: 'text/csv; charset=utf-8',
    });

    const response = await request(app.getHttpServer())
      .get('/audit/export')
      .query({ format: 'csv' })
      .set(authHeaderFor('admin-token'))
      .expect(200);

    expect(exportAuditLogsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'csv',
      }),
    );
    expect(response.headers['content-disposition']).toContain('.csv"');
    expect(response.headers['content-type']).toContain('text/csv');
  });

  it('creates an automatic audit log via @Audit decorator + interceptor', async () => {
    createAuditLogUseCase.execute.mockResolvedValueOnce(sampleAuditLog);

    await request(app.getHttpServer())
      .post('/__test/audit-auto/abc-123/success')
      .set(authHeaderFor('admin-token'))
      .send({
        email: 'user@example.com',
        password: 'secret-value',
        nested: { refreshToken: 'top-secret', ok: true },
      })
      .expect(201);

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'test.auto.success',
        resourceType: 'test_resource',
        resourceId: 'abc-123',
        success: true,
        before: {
          email: 'user@example.com',
          password: '[REDACTED]',
          nested: { refreshToken: '[REDACTED]', ok: true },
        },
        after: {
          id: 'abc-123',
          email: 'user@example.com',
          password: '[REDACTED]',
          nested: {
            refreshToken: '[REDACTED]',
            ok: true,
            password: '[REDACTED]',
          },
          token: '[REDACTED]',
        },
      }),
    );
  });

  it('logs automatic audit failure when decorated endpoint throws', async () => {
    await request(app.getHttpServer())
      .post('/__test/audit-auto/abc-123/fail')
      .set(authHeaderFor('admin-token'))
      .send({ token: 'secret' })
      .expect(401);

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test.auto.fail',
        resourceId: 'abc-123',
        success: false,
        errorMessage: 'forced error',
      }),
    );
  });
});
