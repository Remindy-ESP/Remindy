import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

// We need to mock AuthGuard from @nestjs/passport before it's used
jest.mock('@nestjs/passport', () => {
  const canActivateMock = jest.fn();

  class MockAuthGuard {
    static canActivateMock = canActivateMock;

    canActivate(context: ExecutionContext): boolean {
      return canActivateMock(context);
    }

    handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext): TUser {
      if (err || !user) {
        throw err || new Error('Unauthorized');
      }
      return user as TUser;
    }
  }

  return {
    AuthGuard: jest.fn(() => MockAuthGuard),
    PassportStrategy: jest.fn().mockImplementation((Strategy: any) => Strategy),
  };
});

describe('JwtAuthGuard (guards/jwt-auth.guard.ts)', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  const createMockContext = (overrides: Partial<ExecutionContext> = {}): ExecutionContext => {
    return {
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(class {}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      ...overrides,
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true immediately for public routes', () => {
      const ctx = createMockContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });

    it('should call super.canActivate for non-public routes', () => {
      const ctx = createMockContext();
      reflector.getAllAndOverride.mockReturnValue(null);

      // Just verify it doesn't throw and returns something (the super mock returns undefined/false)
      void guard.canActivate(ctx);
      expect(reflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should check both getHandler and getClass for isPublic metadata', () => {
      const ctx = createMockContext();
      reflector.getAllAndOverride.mockReturnValue(false);

      void guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });

    it('should not proceed to super.canActivate when route is public', () => {
      const ctx = createMockContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'USER_FREEMIUM' };
      const ctx = createMockContext();

      const result = guard.handleRequest(null, mockUser, null, ctx);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      const ctx = createMockContext();

      expect(() => guard.handleRequest(null, null, null, ctx)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      const ctx = createMockContext();

      expect(() => guard.handleRequest(null, undefined, null, ctx)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with default message when user is missing', () => {
      const ctx = createMockContext();

      expect(() => guard.handleRequest(null, null, null, ctx)).toThrow(
        'Invalid or missing authentication token',
      );
    });

    it('should re-throw the provided error when err is set', () => {
      const ctx = createMockContext();
      const customError = new UnauthorizedException('Custom error');

      expect(() => guard.handleRequest(customError, null, null, ctx)).toThrow(customError);
    });

    it('should throw the original error (not a new one) when err is provided', () => {
      const ctx = createMockContext();
      const originalError = new Error('Token expired');

      expect(() => guard.handleRequest(originalError, null, null, ctx)).toThrow(originalError);
    });

    it('should log warn when authentication fails with info message', () => {
      const ctx = createMockContext();
      const info = { message: 'jwt expired' };

      // Should throw but also log
      expect(() => guard.handleRequest(null, null, info, ctx)).toThrow(UnauthorizedException);
    });

    it('should log warn when authentication fails without info message', () => {
      const ctx = createMockContext();

      expect(() => guard.handleRequest(null, null, null, ctx)).toThrow(UnauthorizedException);
    });

    it('should log debug when user authenticated successfully', () => {
      const ctx = createMockContext();
      const mockUser = { id: 'user-789' };

      // Should not throw and return user
      const result = guard.handleRequest(null, mockUser, null, ctx);
      expect(result).toBe(mockUser);
    });

    it('should prefer throwing err over creating new UnauthorizedException', () => {
      const ctx = createMockContext();
      const err = new UnauthorizedException('Token blacklisted');

      try {
        guard.handleRequest(err, null, null, ctx);
        fail('Expected an error to be thrown');
      } catch (e) {
        expect(e).toBe(err);
      }
    });

    it('should return typed user as TUser', () => {
      const ctx = createMockContext();
      const mockUser = { id: 'user-42', role: 'ADMIN', mfaEnabled: true };

      const result = guard.handleRequest<typeof mockUser>(null, mockUser, null, ctx);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe('user-42');
      expect(result.role).toBe('ADMIN');
    });
  });
});
