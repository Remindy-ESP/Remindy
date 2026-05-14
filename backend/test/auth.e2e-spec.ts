import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '../src/modules/auth/application/use-cases/register-user.use-case';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../src/modules/auth/application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../src/modules/auth/application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../src/modules/auth/application/use-cases/reset-password.use-case';
import { JwtRefreshGuard } from '../src/modules/auth/presentation/guards/jwt-refresh.guard';

const TEST_PASSWORD = 'StrongPass123!';

class TestJwtRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    req.cookies = {
      ...(req.cookies ?? {}),
      refreshToken: req.cookies?.refreshToken ?? 'refresh-token-123',
    };

    return true;
  }
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const registerUserUseCase = {
    execute: jest.fn(),
  };

  const loginUseCase = {
    execute: jest.fn(),
  };

  const refreshTokenUseCase = {
    execute: jest.fn(),
  };

  const logoutUseCase = {
    execute: jest.fn(),
  };

  const forgotPasswordUseCase = {
    execute: jest.fn(),
  };

  const resetPasswordUseCase = {
    execute: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: RegisterUserUseCase,
          useValue: registerUserUseCase,
        },
        {
          provide: LoginUseCase,
          useValue: loginUseCase,
        },
        {
          provide: RefreshTokenUseCase,
          useValue: refreshTokenUseCase,
        },
        {
          provide: LogoutUseCase,
          useValue: logoutUseCase,
        },
        {
          provide: ForgotPasswordUseCase,
          useValue: forgotPasswordUseCase,
        },
        {
          provide: ResetPasswordUseCase,
          useValue: resetPasswordUseCase,
        },
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

      req.cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
        const [key, ...valueParts] = part.trim().split('=');
        acc[key] = valueParts.join('=');
        return acc;
      }, {});

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
      password: TEST_PASSWORD,
      firstName: 'John',
      lastName: 'Doe',
    };

    registerUserUseCase.execute.mockResolvedValue({
      getId: () => 'user-1',
    });

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
    const payload = {
      email: 'user@example.com',
      password: TEST_PASSWORD,
    };

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
    const payload = {
      email: 'user@example.com',
    };

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
    const payload = {
      token: 'reset-token-123',
      newPassword: TEST_PASSWORD,
    };

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
});
