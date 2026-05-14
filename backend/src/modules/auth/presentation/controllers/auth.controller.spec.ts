import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import type { Request, Response } from 'express';
const TEST_IP = '192.168.1.1'
const TEST_IP_2 = '10.0.0.1'
describe('AuthController', () => {
  let controller: AuthController;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let refreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;
  let logoutUseCase: jest.Mocked<LogoutUseCase>;
  let forgotPasswordUseCase: jest.Mocked<ForgotPasswordUseCase>;
  let resetPasswordUseCase: jest.Mocked<ResetPasswordUseCase>;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const mockRegisterUserUseCase = {
      execute: jest.fn(),
    };

    const mockLoginUseCase = {
      execute: jest.fn(),
    };

    const mockRefreshTokenUseCase = {
      execute: jest.fn(),
    };

    const mockLogoutUseCase = {
      execute: jest.fn(),
    };

    const mockForgotPasswordUseCase = {
      execute: jest.fn(),
    };

    const mockResetPasswordUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: RegisterUserUseCase,
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
        {
          provide: RefreshTokenUseCase,
          useValue: mockRefreshTokenUseCase,
        },
        {
          provide: LogoutUseCase,
          useValue: mockLogoutUseCase,
        },
        {
          provide: ForgotPasswordUseCase,
          useValue: mockForgotPasswordUseCase,
        },
        {
          provide: ResetPasswordUseCase,
          useValue: mockResetPasswordUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    registerUserUseCase = module.get(RegisterUserUseCase);
    loginUseCase = module.get(LoginUseCase);
    refreshTokenUseCase = module.get(RefreshTokenUseCase);
    logoutUseCase = module.get(LogoutUseCase);
    forgotPasswordUseCase = module.get(ForgotPasswordUseCase);
    resetPasswordUseCase = module.get(ResetPasswordUseCase);

    mockRequest = {
      ip: TEST_IP,
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      cookies: {},
    };

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and auto-login', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = new AuthUser({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      const tokens = {
        accessToken: 'access_token_value',
        refreshToken: 'refresh_token_value',
      };

      registerUserUseCase.execute.mockResolvedValue(mockUser);
      loginUseCase.execute.mockResolvedValue(tokens);

      const result = await controller.register(
        mockRequest as Request,
        registerDto,
        mockResponse as Response,
      );

      expect(registerUserUseCase.execute).toHaveBeenCalledWith(registerDto);
      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
        deviceName: 'web',
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        success: true,
        userId: 'user-123',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    });

    it('should handle missing IP address', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = new AuthUser({
        id: 'user-456',
        email: 'test@example.com',
        passwordHash: 'hashed',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      registerUserUseCase.execute.mockResolvedValue(mockUser);
      loginUseCase.execute.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const reqWithoutIp = { ...mockRequest, ip: undefined };

      await controller.register(reqWithoutIp as Request, registerDto, mockResponse as Response);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: 'unknown',
        }),
      );
    });

    it('should handle missing user agent', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = new AuthUser({
        id: 'user-789',
        email: 'test@example.com',
        passwordHash: 'hashed',
        role_key: Role.USER_FREEMIUM,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
      });

      registerUserUseCase.execute.mockResolvedValue(mockUser);
      loginUseCase.execute.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const reqWithoutUserAgent = {
        ...mockRequest,
        headers: {},
      };

      await controller.register(
        reqWithoutUserAgent as Request,
        registerDto,
        mockResponse as Response,
      );

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: 'unknown',
        }),
      );
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const tokens = {
        accessToken: 'access_token_value',
        refreshToken: 'refresh_token_value',
      };

      loginUseCase.execute.mockResolvedValue(tokens);

      const result = await controller.login(
        mockRequest as Request,
        loginDto,
        mockResponse as Response,
      );

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
        deviceName: 'web',
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    });

    it('should handle missing IP address in login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      loginUseCase.execute.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const reqWithoutIp = { ...mockRequest, ip: undefined };

      await controller.login(reqWithoutIp as Request, loginDto, mockResponse as Response);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: 'unknown',
        }),
      );
    });

    it('should handle missing user agent in login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      loginUseCase.execute.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const reqWithoutUserAgent = {
        ...mockRequest,
        headers: {},
      };

      await controller.login(reqWithoutUserAgent as Request, loginDto, mockResponse as Response);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: 'unknown',
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token from cookies (web client)', async () => {
      const reqWithCookie = {
        ...mockRequest,
        cookies: { refreshToken: 'old_refresh_token' },
      };

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      refreshTokenUseCase.execute.mockResolvedValue(newTokens);

      const result = await controller.refreshToken(
        reqWithCookie as Request,
        mockResponse as Response,
      );

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'old_refresh_token',
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    });

    it('should refresh token from body (mobile client)', async () => {
      const body = { refreshToken: 'mobile_refresh_token' };

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      refreshTokenUseCase.execute.mockResolvedValue(newTokens);

      const result = await controller.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
        body,
      );

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'mobile_refresh_token',
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toEqual({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    });

    it('should prioritize cookie over body refresh token', async () => {
      const reqWithCookie = {
        ...mockRequest,
        cookies: { refreshToken: 'cookie_token' },
      };
      const body = { refreshToken: 'body_token' };

      refreshTokenUseCase.execute.mockResolvedValue({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      await controller.refreshToken(reqWithCookie as Request, mockResponse as Response, body);

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: 'cookie_token',
        }),
      );
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      await expect(
        controller.refreshToken(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        controller.refreshToken(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Refresh token missing');

      expect(refreshTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is undefined in body', async () => {
      const body = { refreshToken: undefined };

      await expect(
        controller.refreshToken(mockRequest as Request, mockResponse as Response, body),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should prioritize cookie refresh token even when cookie value is not a string', async () => {
      const reqWithInvalidCookie = {
        ...mockRequest,
        cookies: { refreshToken: 12345 },
      };

      refreshTokenUseCase.execute.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      await controller.refreshToken(
        reqWithInvalidCookie as Request,
        mockResponse,
        { refreshToken: 'body_token' }
      );

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 12345,
        ipAddress: TEST_IP,
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should pass undefined userAgent to refresh use case when header is missing', async () => {
      const reqWithoutUserAgent = {
        ...mockRequest,
        headers: {},
        cookies: { refreshToken: 'cookie_token' },
      };

      refreshTokenUseCase.execute.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      await controller.refreshToken(
  reqWithoutUserAgent as Request,
  mockResponse
);

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'cookie_token',
        ipAddress: TEST_IP,
        userAgent: undefined,
      });
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookie', async () => {
      const reqWithRefreshToken = {
        ...mockRequest,
        cookies: { refreshToken: 'refresh_token_123' },
      };

      logoutUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.logout(
        reqWithRefreshToken as Request,
        mockResponse as Response,
      );

      expect(logoutUseCase.execute).toHaveBeenCalledWith('refresh_token_123');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(result).toEqual({ success: true });
    });

    it('should handle logout without refresh token', async () => {
      const reqWithoutToken = {
        ...mockRequest,
        cookies: {},
      };

      logoutUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.logout(reqWithoutToken as Request, mockResponse as Response);

      expect(logoutUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(result).toEqual({ success: true });
    });

    it('should handle logout with different refresh tokens', async () => {
      const reqWithToken1 = {
        ...mockRequest,
        cookies: { refreshToken: 'refresh_token_456' },
      };

      logoutUseCase.execute.mockResolvedValue(undefined);

      await controller.logout(reqWithToken1 as Request, mockResponse as Response);

      expect(logoutUseCase.execute).toHaveBeenCalledWith('refresh_token_456');
    });
    it('should not call logout use case when refreshToken cookie is not a string', async () => {
      const reqWithInvalidCookie = {
        ...mockRequest,
        cookies: { refreshToken: 12345 },
      };

      const result = await controller.logout(
        reqWithInvalidCookie as Request,
        mockResponse as Response,
      );

      expect(logoutUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('forgotPassword', () => {
    it('should process forgot password request', async () => {
      const dto = { email: 'test@example.com' };

      forgotPasswordUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(dto);

      expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    });

    it('should return same message for non-existent email', async () => {
      const dto = { email: 'nonexistent@example.com' };

      forgotPasswordUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    });
  });

  describe('register fallback values', () => {
    it('should use unknown fallback for missing ip and user-agent during registration auto-login', async () => {
      const registerDto = { email: 'fallback@example.com', password: 'SecurePass123!' };
      const user = { getId: jest.fn().mockReturnValue('user-fallback') } as any;
      registerUserUseCase.execute.mockResolvedValue(user);
      loginUseCase.execute.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-fallback',
      });

      const request = { headers: {} } as any;
      const response = { cookie: jest.fn() } as any;

      await controller.register(request, registerDto as any, response);

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        deviceName: 'web',
      });
    });
  });

  describe('login fallback values', () => {
    it('should use unknown fallback for missing ip and user-agent during login', async () => {
      loginUseCase.execute.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-123',
      });

      const request = { headers: {} } as any;
      const response = { cookie: jest.fn() } as any;

      await controller.login(
        request,
        { email: 'test@example.com', password: 'SecurePass123!' } as any,
        response,
      );

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
        ipAddress: 'unknown',
        userAgent: 'unknown',
        deviceName: 'web',
      });
    });
  });

  describe('refreshToken branches', () => {
    it('should use refresh token from request body when cookie is missing', async () => {
      process.env.NODE_ENV = 'production';
      refreshTokenUseCase.execute.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const request = {
        ip: TEST_IP_2,
        headers: {},
        cookies: {},
      } as any;
      const response = { cookie: jest.fn() } as any;

      const result = await controller.refreshToken(request, response, {
        refreshToken: 'body-refresh-token',
      });

      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'body-refresh-token',
        ipAddress: TEST_IP_2,
        userAgent: undefined,
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.objectContaining({ secure: true, sameSite: 'strict', path: '/' }),
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw when no refresh token is provided in cookie or body', async () => {
      const request = { cookies: {}, headers: {} } as any;
      const response = { cookie: jest.fn() } as any;

      await expect(controller.refreshToken(request, response, {})).rejects.toThrow(
        new UnauthorizedException('Refresh token missing'),
      );
    });
  });

  describe('logout branches', () => {
    it('should not call logout use case when refresh token cookie is not a string', async () => {
      const request = { cookies: { refreshToken: 12345 } } as any;
      const response = { clearCookie: jest.fn() } as any;

      const result = await controller.logout(request, response);

      expect(logoutUseCase.execute).not.toHaveBeenCalled();
      expect(response.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const dto = {
        token: 'reset_token_123',
        newPassword: 'NewSecurePass456!',
      };

      resetPasswordUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.resetPassword(dto);

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
        token: dto.token,
        newPassword: dto.newPassword,
      });
      expect(result).toEqual({
        success: true,
        message: 'Password successfully reset',
      });
    });

    it('should handle reset password with different tokens', async () => {
      const dto1 = { token: 'token1', newPassword: 'Password1!' };
      const dto2 = { token: 'token2', newPassword: 'Password2!' };

      resetPasswordUseCase.execute.mockResolvedValue(undefined);

      await controller.resetPassword(dto1);
      await controller.resetPassword(dto2);

      expect(resetPasswordUseCase.execute).toHaveBeenNthCalledWith(1, {
        token: 'token1',
        newPassword: 'Password1!',
      });
      expect(resetPasswordUseCase.execute).toHaveBeenNthCalledWith(2, {
        token: 'token2',
        newPassword: 'Password2!',
      });
    });
  });
});

describe('AuthController constructor branch coverage', () => {
  it('should instantiate with null dependencies to cover constructor parameter branches', () => {
    const instance = new AuthController(
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
    );
    expect(instance).toBeDefined();
  });
});
