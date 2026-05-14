import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('domain JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const buildRequest = (authHeader?: string) => ({
    headers: authHeader ? { authorization: authHeader } : {},
  });

  const buildContext = (authHeader?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => buildRequest(authHeader),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
  });

  it('returns true for public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const context = buildContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('delegates to passport auth guard for protected routes (non-test env)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    const context = buildContext('Bearer some-token');
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const superSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(true);

    process.env.NODE_ENV = 'production';

    expect(guard.canActivate(context)).toBe(true);
    expect(superSpy).toHaveBeenCalledWith(context);
  });

  describe('test environment bypass (NODE_ENV === test)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('accepts a known Bearer token and populates req.user', () => {
      const req = buildRequest('Bearer user-token');
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

    it('throws UnauthorizedException for an unknown Bearer token', () => {
      expect(() => guard.canActivate(buildContext('Bearer unknown-bad-token'))).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when no Authorization header is present', () => {
      expect(() => guard.canActivate(buildContext())).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when Authorization header is not Bearer', () => {
      expect(() => guard.canActivate(buildContext('Basic dXNlcjpwYXNz'))).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('handleRequest', () => {
    it('returns the authenticated user', () => {
      const user = { id: 'user-1' };
      expect(guard.handleRequest(null, user, null, buildContext())).toBe(user);
    });

    it('throws UnauthorizedException when user is missing', () => {
      expect(() =>
        guard.handleRequest(null, null, { message: 'missing' }, buildContext()),
      ).toThrow(UnauthorizedException);
    });

    it('rethrows original error when provided', () => {
      const error = new Error('boom');
      expect(() => guard.handleRequest(error, null, null, buildContext())).toThrow(error);
    });

    it('throws default UnauthorizedException when info and user are missing', () => {
      expect(() => guard.handleRequest(null, null, null, buildContext())).toThrow(
        'Invalid or missing authentication token',
      );
    });
  });
});

describe('domain JwtAuthGuard constructor branch coverage', () => {
  it('should instantiate with a mock reflector', () => {
    const mockReflector = { getAllAndOverride: jest.fn() };
    expect(new JwtAuthGuard(mockReflector as any)).toBeDefined();
  });
});