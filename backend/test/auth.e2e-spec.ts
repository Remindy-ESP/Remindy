import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '../src/modules/auth/application/use-cases/register-user.use-case';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../src/modules/auth/application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../src/modules/auth/application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../src/modules/auth/application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from '../src/modules/auth/application/use-cases/verify-email.use-case';
import { OAuthLoginUseCase } from '../src/modules/auth/application/use-cases/oauth-login.use-case';
import { GoogleOAuthService } from '../src/modules/auth/infrastructure/services/google-oauth.service';
import { JwtRefreshGuard } from '../src/modules/auth/presentation/guards/jwt-refresh.guard';

const TEST_USER_CREDENTIAL = 'fake-password-for-tests';

class TestJwtRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.cookies ??= {};
    req.cookies.refreshToken = req.cookies.refreshToken ?? 'refresh-token-123';
    return true;
  }
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const registerUserUseCase = { execute: jest.fn() };
  const loginUseCase = { execute: jest.fn() };
  const refreshTokenUseCase = { execute: jest.fn() };
  const logoutUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const verifyEmailUseCase = { execute: jest.fn() };
  const oauthLoginUseCase = { execute: jest.fn() };
  const googleOAuthService = { exchangeCodeForIdToken: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUserUseCase },
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RefreshTokenUseCase, useValue: refreshTokenUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: VerifyEmailUseCase, useValue: verifyEmailUseCase },
        { provide: OAuthLoginUseCase, useValue: oauthLoginUseCase },
        { provide: GoogleOAuthService, useValue: googleOAuthService },
      ],
    })
      .overrideGuard(JwtRefreshGuard)
      .useClass(TestJwtRefreshGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.use((req, _res, next) => {
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        req.cookies = {};
        return next();
      }
      req.cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, part: string) => {
        const [key, ...valueParts] = part.trim().split('=');
        acc[key] = valueParts.join('=');
        return acc;
      }, {}) as Record<string, string>;
      next();
    });

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register', async () => {
    const payload = {
      email: 'user@example.com',
      password: TEST_USER_CREDENTIAL,
      firstName: 'John',
      lastName: 'Doe',
    };

    registerUserUseCase.execute.mockResolvedValue({ getId: () => 'user-1' });
    loginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const res = await request(app.getHttpServer()).post('/auth/register').send(payload).expect(201);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith(payload);
    expect(loginUseCase.execute).toHaveBeenCalledWith({
      email: payload.email,
      password: payload.password,
      ipAddress: expect.any(String),
      userAgent: expect.any(String),
      deviceName: 'web',
    });
    expect(res.body).toEqual({
      success: true,
      userId: 'user-1',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/login', async () => {
    const payload = { email: 'user@example.com', password: TEST_USER_CREDENTIAL };

    loginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const res = await request(app.getHttpServer()).post('/auth/login').send(payload).expect(201);

    expect(loginUseCase.execute).toHaveBeenCalledWith({
      email: payload.email,
      password: payload.password,
      ipAddress: expect.any(String),
      userAgent: expect.any(String),
      deviceName: 'web',
    });
    expect(res.body).toEqual({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/refresh-token', async () => {
    refreshTokenUseCase.execute.mockResolvedValue({
      accessToken: 'new-access-token-123',
      refreshToken: 'new-refresh-token-123',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', ['refreshToken=refresh-token-123'])
      .expect(201);

    expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
      refreshToken: 'refresh-token-123',
      ipAddress: expect.any(String),
      userAgent: undefined,
    });
    expect(res.body).toEqual({
      accessToken: 'new-access-token-123',
      refreshToken: 'new-refresh-token-123',
    });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/logout', async () => {
    logoutUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', ['refreshToken=refresh-token-123'])
      .expect(201);

    expect(logoutUseCase.execute).toHaveBeenCalledWith('refresh-token-123');
    expect(res.body).toEqual({ success: true });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/forgot-password', async () => {
    const payload = { email: 'user@example.com' };
    forgotPasswordUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send(payload)
      .expect(201);

    expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith(payload.email);
    expect(res.body).toEqual({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  });

  it('POST /auth/reset-password', async () => {
    const payload = { token: 'reset-token-123', newPassword: TEST_USER_CREDENTIAL };
    resetPasswordUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send(payload)
      .expect(201);

    expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
      token: payload.token,
      newPassword: payload.newPassword,
    });
    expect(res.body).toEqual({
      success: true,
      message: 'Password successfully reset',
    });
  });

  it('GET /auth/verify-email - success', async () => {
    verifyEmailUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .get('/auth/verify-email')
      .query({ token: 'valid-token-123' })
      .expect(200);

    expect(verifyEmailUseCase.execute).toHaveBeenCalledWith('valid-token-123');
    expect(res.body).toEqual({
      success: true,
      message: 'Email successfully verified',
    });
  });

  it('GET /auth/verify-email - invalid token returns 401', async () => {
    verifyEmailUseCase.execute.mockRejectedValue(
      new UnauthorizedException('Invalid or expired token'),
    );

    await request(app.getHttpServer())
      .get('/auth/verify-email')
      .query({ token: 'bad-token' })
      .expect(401);

    expect(verifyEmailUseCase.execute).toHaveBeenCalledWith('bad-token');
  });
});
