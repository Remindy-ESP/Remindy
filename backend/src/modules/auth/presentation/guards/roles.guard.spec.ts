import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../domain/value-objects/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
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
    it('should allow access when no roles are required', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should allow access when required roles array is empty', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      const mockRequest = {
        user: { role: Role.USER_ADMIN },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const mockRequest = {
        user: { role: Role.USER_PREMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([
        Role.USER_ADMIN,
        Role.USER_PREMIUM,
        Role.USER_FREEMIUM,
      ]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should deny access when user has role not in required roles list', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN, Role.USER_PREMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should throw ForbiddenException when user object is missing', () => {
      const mockRequest = {};
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Role missing');
    });

    it('should throw ForbiddenException when user.role is missing', () => {
      const mockRequest = {
        user: {},
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Role missing');
    });

    it('should throw ForbiddenException when user.role is null', () => {
      const mockRequest = {
        user: { role: null },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Role missing');
    });

    it('should throw ForbiddenException when user.role is undefined', () => {
      const mockRequest = {
        user: { role: undefined },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Role missing');
    });

    it('should check handler and class for roles metadata', () => {
      const mockRequest = {
        user: { role: Role.USER_ADMIN },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should work with USER_ADMIN role', () => {
      const mockRequest = {
        user: { role: Role.USER_ADMIN },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should work with USER_FREEMIUM role', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_FREEMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should work with USER_PREMIUM role', () => {
      const mockRequest = {
        user: { role: Role.USER_PREMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_PREMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle single required role', () => {
      const mockRequest = {
        user: { role: Role.USER_PREMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_PREMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle multiple required roles', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([
        Role.USER_FREEMIUM,
        Role.USER_PREMIUM,
        Role.USER_ADMIN,
      ]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user is first in multiple required roles', () => {
      const mockRequest = {
        user: { role: Role.USER_ADMIN },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN, Role.USER_PREMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user is last in multiple required roles', () => {
      const mockRequest = {
        user: { role: Role.USER_FREEMIUM },
      };
      const mockContext = createMockExecutionContext(mockRequest);

      reflector.getAllAndOverride.mockReturnValue([Role.USER_ADMIN, Role.USER_FREEMIUM]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
});
