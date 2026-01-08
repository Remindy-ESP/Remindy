import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from '../../infrastructure/services/jwt-token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtTokenService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockJwtService = {
      verifyAccessToken: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtTokenService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtTokenService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', () => {
      const mockContext = createMockExecutionContext({
        headers: {},
      });

      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should validate token and attach user to request', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAccessToken.mockReturnValue({
        sub: 'user-123',
        role: 'USER_FREEMIUM',
        email: 'test@example.com',
      } as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(mockRequest).toHaveProperty('user', {
        id: 'user-123',
        userId: 'user-123',
        role: 'USER_FREEMIUM',
      });
    });

    it('should throw UnauthorizedException when Authorization header is missing', () => {
      const mockRequest = {
        headers: {},
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Missing Authorization header');
    });

    it('should throw UnauthorizedException when Authorization header is empty', () => {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Missing Authorization header');
    });

    it('should throw UnauthorizedException when Authorization type is not Bearer', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic some_token',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid Authorization format');
    });

    it('should throw UnauthorizedException when token is missing after Bearer', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid Authorization format');
    });

    it('should throw UnauthorizedException when token is empty string after Bearer', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid Authorization format');
    });

    it('should throw UnauthorizedException when token verification fails', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when token is expired', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer expired_token',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid or expired token');
    });

    it('should work with different user roles', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer admin_token',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAccessToken.mockReturnValue({
        sub: 'admin-456',
        role: 'ADMIN',
        email: 'admin@example.com',
      } as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest).toHaveProperty('user', {
        id: 'admin-456',
        userId: 'admin-456',
        role: 'ADMIN',
      });
    });

    it('should extract only userId and role from token payload', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token_with_extra_fields',
        },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAccessToken.mockReturnValue({
        sub: 'user-789',
        role: 'USER_PREMIUM',
        email: 'premium@example.com',
        iat: 1234567890,
        exp: 1234567900,
      } as any);

      guard.canActivate(mockContext);

      expect(mockRequest.user).toEqual({
        id: 'user-789',
        userId: 'user-789',
        role: 'USER_PREMIUM',
      });
      expect(mockRequest.user).not.toHaveProperty('email');
      expect(mockRequest.user).not.toHaveProperty('iat');
      expect(mockRequest.user).not.toHaveProperty('exp');
    });

    it('should check handler and class for public decorator', () => {
      const mockContext = createMockExecutionContext({
        headers: {},
      });

      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

  });
});
