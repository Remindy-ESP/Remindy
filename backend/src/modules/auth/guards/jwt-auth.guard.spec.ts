import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('domain JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true for public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('delegates to passport auth guard for protected routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype) as any;
    const superSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(superSpy).toHaveBeenCalledWith(context);
  });

  it('returns the authenticated user from handleRequest', () => {
    const user = { id: 'user-1' };
    expect(guard.handleRequest(null, user, null, context)).toBe(user);
  });

  it('throws UnauthorizedException when user is missing', () => {
    expect(() => guard.handleRequest(null, null, { message: 'missing' }, context)).toThrow(
      UnauthorizedException,
    );
  });

  it('rethrows the original error when passport provides one', () => {
    const error = new Error('boom');
    expect(() => guard.handleRequest(error, null, null, context)).toThrow(error);
  });
});
