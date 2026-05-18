import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { UserController } from '../src/modules/user/presentation/controllers/user.controller';
import { UserService } from '../src/modules/user/domain/services/user.service';
import { UserPreferencesService } from '../src/modules/user/domain/services/user-preferences.service';
import { GetMyProfileUseCase } from '../src/modules/user/application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../src/modules/user/application/use-cases/update-my-profile.use-case';
import { GetMyPreferencesUseCase } from '../src/modules/user/application/use-cases/get-my-preferences.use-case';
import { UpdateUserPreferencesUseCase } from '../src/modules/user/application/use-cases/update-user-preferences.use-case';
import { RequestRgpdExportUseCase } from '../src/modules/user/application/use-cases/request-rgpd-export.use-case';
import { RgpdExportService } from '../src/modules/user/application/services/rgpd-export.service';
import { CloudflareR2Service } from '../src/modules/document/infrastructure/services/cloudflare-r2.service';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      userId: 'user-1',
      role: 'USER_FREEMIUM',
    };
    return true;
  }
}

describe('UserController (e2e)', () => {
  let app: INestApplication;

  const profile = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    photoR2Key: null,
    role_key: 'USER_FREEMIUM',
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const updatedProfile = {
    ...profile,
    firstName: 'Jane',
  };

  const preferencesEntity = {
    userId: 'user-1',
    notificationEmail: true,
    notificationPush: false,
    notificationSms: false,
    theme: 'dark',
    currency: 'EUR',
    defaultReminderDelay: 15,
    showOnlineStatus: true,
  };

  const updatedPreferencesEntity = {
    ...preferencesEntity,
    notificationEmail: false,
    notificationPush: true,
  };

  const userService = {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const userPreferencesService = {};

  const getMyProfileUseCase = {
    execute: jest.fn(),
  };

  const updateMyProfileUseCase = {
    execute: jest.fn(),
  };

  const getMyPreferencesUseCase = {
    execute: jest.fn(),
  };

  const updateUserPreferencesUseCase = {
    execute: jest.fn(),
  };

  const requestRgpdExportUseCase = {
    execute: jest.fn(),
  };

  const rgpdExportService = {
    createExportRequest: jest.fn(),
  };

  const r2Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: UserPreferencesService, useValue: userPreferencesService },
        { provide: GetMyProfileUseCase, useValue: getMyProfileUseCase },
        { provide: UpdateMyProfileUseCase, useValue: updateMyProfileUseCase },
        { provide: GetMyPreferencesUseCase, useValue: getMyPreferencesUseCase },
        { provide: UpdateUserPreferencesUseCase, useValue: updateUserPreferencesUseCase },
        { provide: RequestRgpdExportUseCase, useValue: requestRgpdExportUseCase },
        { provide: RgpdExportService, useValue: rgpdExportService },
        { provide: CloudflareR2Service, useValue: r2Service },
      ],
    })
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

    userService.getUserProfile.mockResolvedValue(profile);
    userService.updateUserProfile.mockResolvedValue(updatedProfile);
    userService.deleteAccount.mockResolvedValue(undefined);

    getMyProfileUseCase.execute.mockResolvedValue(profile);
    updateMyProfileUseCase.execute.mockResolvedValue(undefined);

    getMyPreferencesUseCase.execute.mockResolvedValue(preferencesEntity);
    updateUserPreferencesUseCase.execute.mockResolvedValue(updatedPreferencesEntity);

    rgpdExportService.createExportRequest.mockResolvedValue({
      id: 'export-1',
      userId: 'user-1',
      status: 'pending',
      format: 'json',
      fileR2Key: null,
      fileSize: null,
      signedUrl: null,
      expiresAt: null,
      errorMessage: null,
      requestedBy: 'user',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
    });

    r2Service.uploadFile.mockResolvedValue(undefined);
    r2Service.deleteFile.mockResolvedValue(undefined);
    r2Service.getSignedUrl.mockResolvedValue('https://signed.example/photo');
  });

  it('GET /users/profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(userService.getUserProfile).toHaveBeenCalledWith('user-1');
    expect(res.body).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
    });
  });

  it('PUT /users/profile', async () => {
    const payload = { firstName: 'Jane' };

    const res = await request(app.getHttpServer())
      .put('/users/profile')
      .set('Authorization', 'Bearer test-token')
      .send(payload)
      .expect(200);

    expect(userService.updateUserProfile).toHaveBeenCalledWith('user-1', payload);
    expect(res.body).toMatchObject({
      id: 'user-1',
      firstName: 'Jane',
    });
  });

  it('GET /users/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.body).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
    });
  });

  it('POST /users/export-data', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/export-data')
      .set('Authorization', 'Bearer test-token')
      .send({ format: 'json' })
      .expect(201);

    expect(rgpdExportService.createExportRequest).toHaveBeenCalledWith(
      'user-1',
      { format: 'json' },
      expect.any(String),
    );

    expect(res.body).toMatchObject({
      id: 'export-1',
      status: 'pending',
    });
  });

  it('DELETE /users/me', async () => {
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', 'Bearer test-token')
      .expect(204);

    expect(userService.deleteAccount).toHaveBeenCalledWith('user-1');
  });
});
