import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('domain JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const makeContext = (authHeader?: string) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: () => ({ headers: { authorization: authHeader } }),
    }),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true for public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = makeContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('delegates to passport auth guard for protected routes (non-test env)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = makeContext('Bearer some-token');
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const superSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(true);

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    expect(guard.canActivate(context)).toBe(true);
    expect(superSpy).toHaveBeenCalledWith(context);

    process.env.NODE_ENV = originalEnv;
  });

  describe('test environment bypass (NODE_ENV === test)', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('accepts a valid Bearer token and populates req.user', () => {
      const req = { headers: { authorization: 'Bearer test-token' } } as any;
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000001',
        role: 'USER_PREMIUM',
      });
    });

    it('throws UnauthorizedException when no Authorization header is present', () => {
      const context = makeContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when Authorization header is not Bearer', () => {
      const context = makeContext('Basic dXNlcjpwYXNz');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  it('returns the authenticated user from handleRequest', () => {
    const context = makeContext();
    const user = { id: 'user-1' };
    expect(guard.handleRequest(null, user, null, context)).toBe(user);
  });

  it('throws UnauthorizedException when user is missing', () => {
    const context = makeContext();
    expect(() => guard.handleRequest(null, null, { message: 'missing' }, context)).toThrow(
      UnauthorizedException,
    );
  });

  it('rethrows the original error when passport provides one', () => {
    const context = makeContext();
    const error = new Error('boom');
    expect(() => guard.handleRequest(error, null, null, context)).toThrow(error);
  });

  it('throws UnauthorizedException with default message when info is missing and user is null', () => {
    const context = makeContext();
    expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(null, null, null, context)).toThrow(
      'Invalid or missing authentication token',
    );
  });
});

describe('domain JwtAuthGuard constructor branch coverage', () => {
  it('should instantiate with a mock reflector to cover constructor parameter branches', () => {
    const mockReflector = { getAllAndOverride: jest.fn() };
    const instance = new JwtAuthGuard(mockReflector as any);
    expect(instance).toBeDefined();
  });
});
