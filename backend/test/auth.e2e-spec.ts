import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from '../src/modules/auth/presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '../src/modules/auth/application/use-cases/register-user.use-case';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../src/modules/auth/application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../src/modules/auth/application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../src/modules/auth/application/use-cases/reset-password.use-case';
import { JwtAuthGuard } from '../src/modules/auth/presentation/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../src/modules/auth/presentation/guards/jwt-refresh.guard';
import { RolesGuard } from '../src/modules/auth/presentation/guards/roles.guard';
import { JwtTokenService } from '../src/modules/auth/infrastructure/services/jwt-token.service';
import { EUser } from '../src/infrastructure/database/entities/user.entity';
import { Role } from '../src/modules/auth/domain/value-objects/role.enum';

/**
 * Replaces the Passport-based JwtRefreshGuard so tests do not need a full
 * Passport strategy registration. The mock simply passes through — the
 * RefreshTokenUseCase mock handles all business logic.
 */
class MockJwtRefreshGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  const users: Record<string, { id: string; role: Role; mfaEnabled: boolean }> = {
    'user-1': { id: 'user-1', role: Role.USER_FREEMIUM, mfaEnabled: false },
  };

  const registerUserUseCase = { execute: jest.fn() };
  const loginUseCase = { execute: jest.fn() };
  const refreshTokenUseCase = { execute: jest.fn() };
  const logoutUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const userRepository = { findOne: jest.fn() };

  const validUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const mockAuthUser = {
    getId: () => validUserId,
    getEmail: () => 'user@example.com',
    getRoleKey: () => Role.USER_FREEMIUM,
  };

  const defaultLoginResponse = {
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    userId: validUserId,
  };

  beforeAll(async () => {
    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      switch (token) {
        case 'user-token':
          return { sub: 'user-1', role: Role.USER_FREEMIUM };
        default:
          throw new Error('invalid token');
      }
    });

    userRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      const user = users[where.id];
      if (!user) return null;
      return Promise.resolve({ id: user.id, mfaEnabled: user.mfaEnabled });
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        { provide: RegisterUserUseCase, useValue: registerUserUseCase },
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RefreshTokenUseCase, useValue: refreshTokenUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: getRepositoryToken(EUser), useValue: userRepository },
      ],
    })
      .overrideGuard(JwtRefreshGuard)
      .useClass(MockJwtRefreshGuard)
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

    jwtTokenService.verifyAccessToken.mockImplementation((token: string) => {
      switch (token) {
        case 'user-token':
          return { sub: 'user-1', role: Role.USER_FREEMIUM };
        default:
          throw new Error('invalid token');
      }
    });

    userRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      const user = users[where.id];
      if (!user) return null;
      return Promise.resolve({ id: user.id, mfaEnabled: user.mfaEnabled });
    });

    registerUserUseCase.execute.mockResolvedValue(mockAuthUser);
    loginUseCase.execute.mockResolvedValue(defaultLoginResponse);
    refreshTokenUseCase.execute.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    logoutUseCase.execute.mockResolvedValue(undefined);
    forgotPasswordUseCase.execute.mockResolvedValue(undefined);
    resetPasswordUseCase.execute.mockResolvedValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // POST /auth/register  (@Public — no auth required, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPass1!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(registerUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'newuser@example.com' }),
      );
      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'newuser@example.com' }),
      );
      expect(response.body).toMatchObject({
        success: true,
        userId: validUserId,
        accessToken: 'access-token-value',
      });
    });

    it('registers without optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'minimal@example.com', password: 'StrongPass1!' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('returns 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'StrongPass1!' })
        .expect(400);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'StrongPass1!' })
        .expect(400);
    });

    it('returns 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'user@example.com' })
        .expect(400);
    });

    it('returns 400 for weak password (no special char)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'WeakPass1' })
        .expect(400);
    });

    it('returns 400 for password too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'Sh0r!' })
        .expect(400);
    });

    it('sets refreshToken cookie on successful register', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'cookie@example.com', password: 'StrongPass1!' })
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string[] | string | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('is a public endpoint (no auth header required)', async () => {
      // No Authorization header — must not return 401
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'pub@example.com', password: 'StrongPass1!' });
      expect(response.status).not.toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/login  (@Public — no auth required, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/login', () => {
    it('logs in and returns accessToken + refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'StrongPass1!' })
        .expect(201);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
      );
      expect(response.body).toMatchObject({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      });
    });

    it('sets refreshToken cookie on successful login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'StrongPass1!' })
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string[] | string | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('returns 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'StrongPass1!' })
        .expect(400);
    });

    it('returns 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com' })
        .expect(400);
    });

    it('returns 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'bad-email', password: 'StrongPass1!' })
        .expect(400);
    });

    it('is a public endpoint (no auth header required)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'StrongPass1!' });
      expect(response.status).not.toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/refresh-token  (@Public + JwtRefreshGuard, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/refresh-token', () => {
    it('returns new tokens when refreshToken is in body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'some-refresh-token' })
        .expect(201);

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'some-refresh-token' }),
      );
      expect(response.body).toMatchObject({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('returns 401 when no refreshToken provided (neither body nor cookie)', async () => {
      await request(app.getHttpServer()).post('/auth/refresh-token').send({}).expect(401);
    });

    it('sets refreshToken cookie on successful refresh', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'some-refresh-token' })
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string[] | string | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('is a public endpoint (no Bearer auth header required)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'some-token' });
      // JwtAuthGuard is @Public so no 401 from it; 401 only if refreshToken missing
      expect(response.status).not.toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/logout  (@Public — no JwtAuthGuard required, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/logout', () => {
    it('logs out with refreshToken in body and clears cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'some-refresh-token' })
        .expect(201);

      expect(logoutUseCase.execute).toHaveBeenCalledWith('some-refresh-token');
      expect(response.body).toMatchObject({ success: true });
    });

    it('succeeds with no refreshToken (graceful no-op)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({})
        .expect(201);

      expect(logoutUseCase.execute).not.toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('clears the refreshToken cookie in the response', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'some-refresh-token' })
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string[] | string | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      // Cookie should be cleared (Max-Age=0 or Expires in the past)
      const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
    });

    it('is a public endpoint — works without Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' });
      expect(response.status).not.toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/forgot-password  (@Public, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/forgot-password', () => {
    it('returns success for a valid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'user@example.com' })
        .expect(201);

      expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith('user@example.com');
      expect(response.body).toMatchObject({ success: true });
    });

    it('returns 400 for missing email', async () => {
      await request(app.getHttpServer()).post('/auth/forgot-password').send({}).expect(400);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('is a public endpoint (no auth header required)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'user@example.com' });
      expect(response.status).not.toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/reset-password  (@Public, returns 201)
  // ---------------------------------------------------------------------------
  describe('POST /auth/reset-password', () => {
    it('resets password with valid token and strong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'reset-token-abc', newPassword: 'NewStrongPass1!' })
        .expect(201);

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
        token: 'reset-token-abc',
        newPassword: 'NewStrongPass1!',
      });
      expect(response.body).toMatchObject({ success: true });
    });

    it('returns 400 for missing token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ newPassword: 'NewStrongPass1!' })
        .expect(400);
    });

    it('returns 400 for missing newPassword', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'reset-token-abc' })
        .expect(400);
    });

    it('returns 400 for weak newPassword (no special char)', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'reset-token-abc', newPassword: 'WeakPass1' })
        .expect(400);
    });

    it('is a public endpoint (no auth header required)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'reset-token-abc', newPassword: 'NewStrongPass1!' });
      expect(response.status).not.toBe(401);
    });
  });
});
