import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  INestApplication,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AdminAuditLogEntity,
  ContractEntity,
  EUser,
  RgpdExportEntity,
  RoleEntity,
  UserPreferenceEntity,
  UserSessionEntity,
} from '../src/infrastructure/database/entities';
import { AuditController } from '../src/modules/audit/presentation/controllers/audit.controller';
import { AuditInterceptor } from '../src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from '../src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from '../src/modules/audit/domain/enums/severity.enum';
import { MfaRequiredGuard } from '../src/modules/audit/presentation/guards/mfa-required.guard';
import { IAuditLogRepository } from '../src/modules/audit/domain/repositories/audit-log.repository';
import { AuditLogTypeOrmRepository } from '../src/modules/audit/infrastructure/repositories/audit-log-typeorm.repository';
import { AuditLogMapper } from '../src/modules/audit/infrastructure/mappers/audit-log.mapper';
import { AuditExportService } from '../src/modules/audit/infrastructure/services/audit-export.service';
import { IAuditExportService } from '../src/modules/audit/application/ports/audit-export.service';
import { CreateAuditLogUseCase } from '../src/modules/audit/application/use-cases/create-audit-log.use-case';
import { FindAllAuditLogsUseCase } from '../src/modules/audit/application/use-cases/find-all-audit-logs.use-case';
import { FindAuditLogByIdUseCase } from '../src/modules/audit/application/use-cases/find-audit-log-by-id.use-case';
import { GetAuditStatsUseCase } from '../src/modules/audit/application/use-cases/get-audit-stats.use-case';
import { ExportAuditLogsUseCase } from '../src/modules/audit/application/use-cases/export-audit-logs.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Roles } from '../src/modules/auth/presentation/decorators/roles.decorator';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { role: Role.USER_ADMIN };
    return true;
  }
}

class AllowGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

@Controller('__test/audit-db')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER_ADMIN, Role.SUPER_ADMIN)
@UseInterceptors(AuditInterceptor)
class AuditDbDecoratorTestController {
  @Post('decorated')
  @Audit({
    action: 'crm368.db.decorated',
    resourceType: 'db_test',
    resourceIdBody: 'resourceId',
    severity: Severity.WARNING,
  })
  create(@Body() body: Record<string, unknown>) {
    return {
      ok: true,
      ...body,
      token: 'sensitive-response-token',
    };
  }
}

const describeDbBacked =
  process.env.RUN_AUDIT_DB_E2E === 'true' && process.env.SKIP_DB_E2E !== 'true'
    ? describe
    : describe.skip;

describeDbBacked('Audit JSONB (db-backed e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let auditRepo: Repository<AdminAuditLogEntity>;
  let createdIds: string[] = [];

  const testActionManual = 'crm368.db.manual';
  const testActionDecorated = 'crm368.db.decorated';

  beforeAll(async () => {
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.NEON_DATABASE_URL_TEST ||
      process.env.NEON_DATABASE_URL_DEV;

    if (!databaseUrl) {
      throw new Error('Database URL not configured for db-backed audit e2e tests');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: databaseUrl,
          ssl: process.env.NODE_ENV === 'test' ? false : true,
          synchronize: false,
          autoLoadEntities: false,
          entities: [
            AdminAuditLogEntity,
            EUser,
            RoleEntity,
            UserSessionEntity,
            UserPreferenceEntity,
            RgpdExportEntity,
            ContractEntity,
          ],
        }),
        TypeOrmModule.forFeature([AdminAuditLogEntity]),
      ],
      controllers: [AuditController, AuditDbDecoratorTestController],
      providers: [
        AuditLogMapper,
        AuditLogTypeOrmRepository,
        AuditExportService,
        CreateAuditLogUseCase,
        FindAllAuditLogsUseCase,
        FindAuditLogByIdUseCase,
        GetAuditStatsUseCase,
        ExportAuditLogsUseCase,
        AuditInterceptor,
        { provide: IAuditLogRepository, useExisting: AuditLogTypeOrmRepository },
        { provide: IAuditExportService, useExisting: AuditExportService },
        { provide: JwtAuthGuard, useClass: TestJwtGuard },
        { provide: RolesGuard, useClass: AllowGuard },
        { provide: MfaRequiredGuard, useClass: AllowGuard },
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

    dataSource = moduleFixture.get(getDataSourceToken());
    auditRepo = moduleFixture.get(getRepositoryToken(AdminAuditLogEntity));
  }, 30000);

  afterEach(async () => {
    if (createdIds.length > 0) {
      await auditRepo.delete(createdIds);
      createdIds = [];
    }
  });

  afterAll(async () => {
    try {
      await auditRepo.delete({ action: testActionManual });
      await auditRepo.delete({ action: testActionDecorated });
    } catch {
      // best-effort cleanup
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  it('persists and retrieves nested JSONB payloads via audit endpoints', async () => {
    const uniqueJsonValue = `crm368-jsonb-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/audit/create')
      .send({
        action: testActionManual,
        resourceType: 'db_test',
        resourceId: 'resource-1',
        before: {
          profile: {
            nested: {
              marker: uniqueJsonValue,
              flags: ['a', 'b'],
            },
          },
        },
        after: {
          profile: {
            nested: {
              marker: uniqueJsonValue,
              flags: ['a', 'b', 'c'],
            },
          },
        },
        severity: Severity.INFO,
        success: true,
      })
      .expect(201);

    createdIds.push(createResponse.body.id);

    expect(createResponse.body.actorUserId).toBeNull();
    expect(createResponse.body.before.profile.nested.marker).toBe(uniqueJsonValue);
    expect(createResponse.body.after.profile.nested.flags).toEqual(['a', 'b', 'c']);

    const listResponse = await request(app.getHttpServer())
      .get('/audit/logs')
      .query({ action: testActionManual, search: uniqueJsonValue, page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(listResponse.body.data)).toBe(true);
    const found = listResponse.body.data.find((item: any) => item.id === createResponse.body.id);
    expect(found).toBeDefined();
    expect(found.before.profile.nested.marker).toBe(uniqueJsonValue);
    expect(found.after.profile.nested.flags).toEqual(['a', 'b', 'c']);

    const detailResponse = await request(app.getHttpServer())
      .get(`/audit/logs/${createResponse.body.id}`)
      .expect(200);

    expect(detailResponse.body.before).toEqual(createResponse.body.before);
    expect(detailResponse.body.after).toEqual(createResponse.body.after);
  });

  it('exports persisted audit rows including JSONB content (json + csv)', async () => {
    const uniqueJsonValue = `crm368-export-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/audit/create')
      .send({
        action: testActionManual,
        resourceType: 'db_test',
        before: { jsonb: { value: uniqueJsonValue } },
        after: { jsonb: { value: uniqueJsonValue, changed: true } },
      })
      .expect(201);

    createdIds.push(createResponse.body.id);

    const jsonExport = await request(app.getHttpServer())
      .get('/audit/export')
      .query({ format: 'json', action: testActionManual, search: uniqueJsonValue })
      .expect(200);

    expect(jsonExport.headers['content-type']).toContain('application/json');
    expect(jsonExport.text).toContain(uniqueJsonValue);

    const csvExport = await request(app.getHttpServer())
      .get('/audit/export')
      .query({ format: 'csv', action: testActionManual, search: uniqueJsonValue })
      .expect(200);

    expect(csvExport.headers['content-type']).toContain('text/csv');
    expect(csvExport.text).toContain(uniqueJsonValue);
    expect(csvExport.text).toContain('crm368.db.manual');
  });

  it('persists automatic decorator audit log with sanitized JSONB before/after payloads', async () => {
    const uniqueJsonValue = `crm368-decorated-${Date.now()}`;

    const response = await request(app.getHttpServer())
      .post('/__test/audit-db/decorated')
      .send({
        resourceId: 'decorator-1',
        profile: { marker: uniqueJsonValue },
        password: 'secret-password',
        nested: { refreshToken: 'rt-123', keep: 'ok' },
      })
      .expect(201);

    expect(response.body.ok).toBe(true);

    const listResponse = await request(app.getHttpServer())
      .get('/audit/logs')
      .query({ action: testActionDecorated, search: uniqueJsonValue })
      .expect(200);

    const log = listResponse.body.data[0];
    expect(log).toBeDefined();
    createdIds.push(log.id);
    expect(log.success).toBe(true);
    expect(log.resourceId).toBe('decorator-1');
    expect(log.before.password).toBe('[REDACTED]');
    expect(log.before.nested.refreshToken).toBe('[REDACTED]');
    expect(log.after.token).toBe('[REDACTED]');
    expect(log.after.profile.marker).toBe(uniqueJsonValue);
  });
});
