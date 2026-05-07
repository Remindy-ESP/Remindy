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

import { StorageController } from '../src/modules/storage/storage.controller';
import { StorageQuotaService } from '../src/modules/storage/storage-quota.service';
import { DOCUMENT_REPOSITORY } from '../src/modules/document/application/ports/document-repository.interface';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/**
 * Fake JwtAuthGuard: maps known test tokens to user objects without passport.
 * token          → role
 * user-token     → USER_FREEMIUM
 * premium-token  → USER_PREMIUM
 * admin-token    → USER_ADMIN
 */
class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers.authorization;
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const [, token] = auth.split(' ');
    const tokenMap: Record<string, string> = {
      'user-token': Role.USER_FREEMIUM,
      'premium-token': Role.USER_PREMIUM,
      'admin-token': Role.USER_ADMIN,
    };
    const role = tokenMap[token];
    if (!role) throw new UnauthorizedException('Invalid or expired token');
    req.user = { id: USER_ID, userId: USER_ID, role };
    return true;
  }
}

const sampleQuota = {
  totalBytes: 104857600,
  usedBytes: 5242880,
  availableBytes: 99614720,
  usagePercentage: 5.0,
  documentCount: 3,
  totalFormatted: '100.00 MB',
  usedFormatted: '5.00 MB',
  availableFormatted: '95.00 MB',
};

describe('Storage Module (e2e)', () => {
  let app: INestApplication;

  const storageQuotaService = { getQuota: jest.fn() };
  const documentRepository = { findByUserId: jest.fn() };

  const authHeader = () => ({ Authorization: 'Bearer user-token' });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        { provide: StorageQuotaService, useValue: storageQuotaService },
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtAuthGuard)
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

    storageQuotaService.getQuota.mockResolvedValue(sampleQuota);
    documentRepository.findByUserId.mockResolvedValue([]);
  });

  // ─── Authentication ────────────────────────────────────────────────────────

  it('returns 401 when no Authorization header is provided', async () => {
    await request(app.getHttpServer()).get('/storage/quota').expect(401);
  });

  it('returns 401 when token is invalid', async () => {
    await request(app.getHttpServer())
      .get('/storage/quota')
      .set('Authorization', 'Bearer bad-token')
      .expect(401);
  });

  // ─── GET /storage/quota ────────────────────────────────────────────────────

  it('returns storage quota for an authenticated freemium user', async () => {
    const response = await request(app.getHttpServer())
      .get('/storage/quota')
      .set(authHeader())
      .expect(200);

    expect(storageQuotaService.getQuota).toHaveBeenCalledWith(USER_ID, Role.USER_FREEMIUM);
    expect(response.body).toMatchObject({
      totalBytes: sampleQuota.totalBytes,
      usedBytes: sampleQuota.usedBytes,
      availableBytes: sampleQuota.availableBytes,
      usagePercentage: sampleQuota.usagePercentage,
      documentCount: sampleQuota.documentCount,
      totalFormatted: sampleQuota.totalFormatted,
      usedFormatted: sampleQuota.usedFormatted,
      availableFormatted: sampleQuota.availableFormatted,
    });
  });

  it('passes the correct role to getQuota for a premium user', async () => {
    storageQuotaService.getQuota.mockResolvedValue({
      ...sampleQuota,
      totalBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      totalFormatted: '10.00 GB',
    });

    const response = await request(app.getHttpServer())
      .get('/storage/quota')
      .set('Authorization', 'Bearer premium-token')
      .expect(200);

    expect(storageQuotaService.getQuota).toHaveBeenCalledWith(USER_ID, Role.USER_PREMIUM);
    expect(response.body.totalBytes).toBe(10 * 1024 * 1024 * 1024);
  });

  it('passes the correct role to getQuota for an admin user', async () => {
    storageQuotaService.getQuota.mockResolvedValue({
      ...sampleQuota,
      totalBytes: 50 * 1024 * 1024 * 1024, // 50 GB
      totalFormatted: '50.00 GB',
    });

    await request(app.getHttpServer())
      .get('/storage/quota')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);

    expect(storageQuotaService.getQuota).toHaveBeenCalledWith(USER_ID, Role.USER_ADMIN);
  });

  it('returns a quota with 0 usage for a new user', async () => {
    storageQuotaService.getQuota.mockResolvedValue({
      totalBytes: 104857600,
      usedBytes: 0,
      availableBytes: 104857600,
      usagePercentage: 0,
      documentCount: 0,
      totalFormatted: '100.00 MB',
      usedFormatted: '0 Bytes',
      availableFormatted: '100.00 MB',
    });

    const response = await request(app.getHttpServer())
      .get('/storage/quota')
      .set(authHeader())
      .expect(200);

    expect(response.body.usedBytes).toBe(0);
    expect(response.body.documentCount).toBe(0);
    expect(response.body.usagePercentage).toBe(0);
  });

  it('returns a quota at full capacity (100% usage)', async () => {
    storageQuotaService.getQuota.mockResolvedValue({
      totalBytes: 104857600,
      usedBytes: 104857600,
      availableBytes: 0,
      usagePercentage: 100,
      documentCount: 50,
      totalFormatted: '100.00 MB',
      usedFormatted: '100.00 MB',
      availableFormatted: '0 Bytes',
    });

    const response = await request(app.getHttpServer())
      .get('/storage/quota')
      .set(authHeader())
      .expect(200);

    expect(response.body.usagePercentage).toBe(100);
    expect(response.body.availableBytes).toBe(0);
  });

  it('propagates service errors as 500', async () => {
    storageQuotaService.getQuota.mockRejectedValue(new Error('Database connection lost'));

    await request(app.getHttpServer()).get('/storage/quota').set(authHeader()).expect(500);
  });
});
