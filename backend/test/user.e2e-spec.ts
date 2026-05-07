import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  INestApplication,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserController } from '../src/modules/user/presentation/controllers/user.controller';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { UserService } from '../src/modules/user/domain/services/user.service';
import { UserPreferencesService } from '../src/modules/user/domain/services/user-preferences.service';
import { GetMyProfileUseCase } from '../src/modules/user/application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../src/modules/user/application/use-cases/update-my-profile.use-case';
import { GetMyPreferencesUseCase } from '../src/modules/user/application/use-cases/get-my-preferences.use-case';
import { UpdateUserPreferencesUseCase } from '../src/modules/user/application/use-cases/update-user-preferences.use-case';
import { RequestRgpdExportUseCase } from '../src/modules/user/application/use-cases/request-rgpd-export.use-case';
import { RgpdExportService } from '../src/modules/user/application/services/rgpd-export.service';
import { CloudflareR2Service } from '../src/modules/document/infrastructure/services/cloudflare-r2.service';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ADMIN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('User Module (e2e)', () => {
  let app: INestApplication;

  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const userService = {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteAccount: jest.fn(),
  };
  const userPreferencesService = {};
  const getMyProfileUseCase = { execute: jest.fn() };
  const updateMyProfileUseCase = { execute: jest.fn() };
  const getMyPreferencesUseCase = { execute: jest.fn() };
  const updateUserPreferencesUseCase = { execute: jest.fn() };
  const requestRgpdExportUseCase = { execute: jest.fn() };
  const rgpdExportService = { createExportRequest: jest.fn() };
  const r2Service = { uploadFile: jest.fn(), getSignedUrl: jest.fn(), deleteFile: jest.fn() };

  const authHeaderFor = (token: string) => ({ Authorization: `Bearer ${token}` });

  const sampleEUser = {
    id: USER_ID,
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33612345678',
    photoR2Key: null,
    role_key: Role.USER_PREMIUM,
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    mfaEnabled: false,
    lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
  };

  const sampleUserMeResponse = {
    id: USER_ID,
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: Role.USER_PREMIUM,
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const sampleProfileResponse = {
    id: USER_ID,
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33612345678',
    role_key: Role.USER_PREMIUM,
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
  };

  const samplePreferences = {
    userId: USER_ID,
    theme: 'light',
    notificationEmail: true,
    notificationPush: true,
    notificationSms: false,
    defaultReminderDelay: 3,
    currency: 'EUR',
    showOnlineStatus: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
  };

  const sampleExportResponse = {
    id: 'export-111',
    userId: USER_ID,
    status: 'pending',
    format: 'json',
    requestedBy: 'user',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      switch (token) {
        case 'user-token':
          return { sub: USER_ID, role: Role.USER_PREMIUM };
        case 'admin-token':
          return { sub: ADMIN_ID, role: Role.USER_ADMIN };
        default:
          throw new Error('invalid token');
      }
    });

    userRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === USER_ID) {
        return Promise.resolve({ id: USER_ID, mfaEnabled: false });
      }
      if (where.id === ADMIN_ID) {
        return Promise.resolve({ id: ADMIN_ID, mfaEnabled: true });
      }
      return Promise.resolve(null);
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: UserService, useValue: userService },
        { provide: UserPreferencesService, useValue: userPreferencesService },
        { provide: GetMyProfileUseCase, useValue: getMyProfileUseCase },
        { provide: UpdateMyProfileUseCase, useValue: updateMyProfileUseCase },
        { provide: GetMyPreferencesUseCase, useValue: getMyPreferencesUseCase },
        { provide: UpdateUserPreferencesUseCase, useValue: updateUserPreferencesUseCase },
        { provide: RequestRgpdExportUseCase, useValue: requestRgpdExportUseCase },
        { provide: RgpdExportService, useValue: rgpdExportService },
        { provide: CloudflareR2Service, useValue: r2Service },
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

    getMyProfileUseCase.execute.mockResolvedValue(sampleEUser);
    updateMyProfileUseCase.execute.mockResolvedValue(undefined);
    getMyPreferencesUseCase.execute.mockResolvedValue(samplePreferences);
    updateUserPreferencesUseCase.execute.mockResolvedValue(samplePreferences);
    userService.getUserProfile.mockResolvedValue(sampleProfileResponse);
    userService.updateUserProfile.mockResolvedValue(sampleProfileResponse);
    userService.deleteAccount.mockResolvedValue(undefined);
    rgpdExportService.createExportRequest.mockResolvedValue(sampleExportResponse);
    r2Service.getSignedUrl.mockResolvedValue('https://r2.example.com/signed-url');
    r2Service.uploadFile.mockResolvedValue(undefined);
    r2Service.deleteFile.mockResolvedValue(undefined);
  });

  // ---- Auth guard ----

  it('returns 401 when no token is provided on GET /users/profile', async () => {
    await request(app.getHttpServer()).get('/users/profile').expect(401);
  });

  it('returns 401 when an invalid token is provided on GET /users/me', async () => {
    await request(app.getHttpServer())
      .get('/users/me')
      .set(authHeaderFor('bad-token'))
      .expect(401);
  });

  // ---- GET /users/profile ----

  it('GET /users/profile - returns user profile for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/profile')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(userService.getUserProfile).toHaveBeenCalledWith(USER_ID);
    expect(response.body).toMatchObject({
      id: USER_ID,
      email: 'user@example.com',
      role_key: Role.USER_PREMIUM,
    });
  });

  // ---- GET /users/me ----

  it('GET /users/me - returns current user me-response', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: USER_ID });
    expect(response.body).toMatchObject({
      id: USER_ID,
      email: 'user@example.com',
      role: Role.USER_PREMIUM,
    });
  });

  it('GET /users/me - generates a signed URL when user has a photoR2Key', async () => {
    getMyProfileUseCase.execute.mockResolvedValueOnce({
      ...sampleEUser,
      photoR2Key: 'users/abc/profile-photo/123-photo.jpg',
    });

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(r2Service.getSignedUrl).toHaveBeenCalledWith(
      'users/abc/profile-photo/123-photo.jpg',
      86400,
    );
    expect(response.body.photoUrl).toBe('https://r2.example.com/signed-url');
  });

  // ---- PUT /users/me ----

  it('PUT /users/me - updates user profile and returns updated me-response', async () => {
    const updatePayload = { firstName: 'Marie', lastName: 'Curie', language: 'fr' };

    const response = await request(app.getHttpServer())
      .put('/users/me')
      .set(authHeaderFor('user-token'))
      .send(updatePayload)
      .expect(200);

    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ firstName: 'Marie', lastName: 'Curie', language: 'fr' }),
    );
    expect(response.body).toMatchObject({ id: USER_ID, email: 'user@example.com' });
  });

  it('PUT /users/me - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .put('/users/me')
      .send({ firstName: 'Marie' })
      .expect(401);
  });

  it('PUT /users/me - returns 400 when non-whitelisted fields are sent', async () => {
    await request(app.getHttpServer())
      .put('/users/me')
      .set(authHeaderFor('user-token'))
      .send({ firstName: 'Marie', hackerField: 'bad' })
      .expect(400);
  });

  // ---- DELETE /users/me ----

  it('DELETE /users/me - deletes account and returns 204', async () => {
    await request(app.getHttpServer())
      .delete('/users/me')
      .set(authHeaderFor('user-token'))
      .expect(204);

    expect(userService.deleteAccount).toHaveBeenCalledWith(USER_ID);
  });

  it('DELETE /users/me - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).delete('/users/me').expect(401);
  });

  // ---- PUT /users/profile ----

  it('PUT /users/profile - updates profile and returns updated profile', async () => {
    const updatePayload = { firstName: 'Luc', lastName: 'Bernard', timezone: 'UTC' };

    const response = await request(app.getHttpServer())
      .put('/users/profile')
      .set(authHeaderFor('user-token'))
      .send(updatePayload)
      .expect(200);

    expect(userService.updateUserProfile).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ firstName: 'Luc', lastName: 'Bernard', timezone: 'UTC' }),
    );
    expect(response.body).toMatchObject({ id: USER_ID });
  });

  it('PUT /users/profile - returns 400 for invalid phone number format', async () => {
    await request(app.getHttpServer())
      .put('/users/profile')
      .set(authHeaderFor('user-token'))
      .send({ phone: 'not-a-phone' })
      .expect(400);
  });

  it('PUT /users/profile - returns 400 for firstName exceeding max length', async () => {
    await request(app.getHttpServer())
      .put('/users/profile')
      .set(authHeaderFor('user-token'))
      .send({ firstName: 'A'.repeat(101) })
      .expect(400);
  });

  // ---- GET /users/preferences ----

  it('GET /users/preferences - returns user preferences', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/preferences')
      .set(authHeaderFor('user-token'))
      .expect(200);

    expect(getMyPreferencesUseCase.execute).toHaveBeenCalledWith(USER_ID);
    expect(response.body).toMatchObject({
      userId: USER_ID,
      theme: 'light',
      notificationEmail: true,
      currency: 'EUR',
    });
  });

  it('GET /users/preferences - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/users/preferences').expect(401);
  });

  // ---- PUT /users/preferences ----

  it('PUT /users/preferences - updates preferences and returns updated result', async () => {
    const updatedPrefs = { ...samplePreferences, theme: 'dark', notificationSms: true };
    updateUserPreferencesUseCase.execute.mockResolvedValueOnce(updatedPrefs);

    const response = await request(app.getHttpServer())
      .put('/users/preferences')
      .set(authHeaderFor('user-token'))
      .send({ theme: 'dark', notificationSms: true })
      .expect(200);

    expect(updateUserPreferencesUseCase.execute).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ theme: 'dark', notificationSms: true }),
    );
    expect(response.body.theme).toBe('dark');
  });

  it('PUT /users/preferences - returns 400 for invalid theme value', async () => {
    await request(app.getHttpServer())
      .put('/users/preferences')
      .set(authHeaderFor('user-token'))
      .send({ theme: 'rainbow' })
      .expect(400);
  });

  it('PUT /users/preferences - returns 400 when defaultReminderDelay is out of range', async () => {
    await request(app.getHttpServer())
      .put('/users/preferences')
      .set(authHeaderFor('user-token'))
      .send({ defaultReminderDelay: 0 })
      .expect(400);
  });

  it('PUT /users/preferences - returns 400 when defaultReminderDelay exceeds max', async () => {
    await request(app.getHttpServer())
      .put('/users/preferences')
      .set(authHeaderFor('user-token'))
      .send({ defaultReminderDelay: 366 })
      .expect(400);
  });

  it('PUT /users/preferences - returns 400 when currency exceeds 3 chars', async () => {
    await request(app.getHttpServer())
      .put('/users/preferences')
      .set(authHeaderFor('user-token'))
      .send({ currency: 'EUROS' })
      .expect(400);
  });

  // ---- POST /users/export-data ----

  it('POST /users/export-data - creates a RGPD export request', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/export-data')
      .set(authHeaderFor('user-token'))
      .send({ format: 'json' })
      .expect(201);

    expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
      USER_ID,
      { format: 'json' },
      expect.any(String),
    );
    expect(response.body).toMatchObject({ status: 'pending', format: 'json' });
  });

  it('POST /users/export-data - uses csv format when specified', async () => {
    const csvExport = { ...sampleExportResponse, format: 'csv' };
    rgpdExportService.createExportRequest.mockResolvedValueOnce(csvExport);

    const response = await request(app.getHttpServer())
      .post('/users/export-data')
      .set(authHeaderFor('user-token'))
      .send({ format: 'csv' })
      .expect(201);

    expect(response.body.format).toBe('csv');
  });

  it('POST /users/export-data - returns 400 for invalid format', async () => {
    await request(app.getHttpServer())
      .post('/users/export-data')
      .set(authHeaderFor('user-token'))
      .send({ format: 'xml' })
      .expect(400);
  });

  it('POST /users/export-data - returns 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/users/export-data')
      .send({ format: 'json' })
      .expect(401);
  });
});
