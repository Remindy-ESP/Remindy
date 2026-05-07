import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminCsrfGuard } from './admin-csrf.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';

function makeCtx(options: {
  method: string;
  cookieToken?: string;
  headerToken?: string | string[];
  userId?: string;
  ip?: string;
  path?: string;
}): ExecutionContext {
  const req: any = {
    method: options.method,
    cookies: options.cookieToken ? { csrfToken: options.cookieToken } : {},
    headers: {},
    user: options.userId ? { id: options.userId } : undefined,
    ip: options.ip ?? '1.2.3.4',
    path: options.path ?? '/admin/test',
  };
  if (options.headerToken !== undefined) {
    req.headers['x-csrf-token'] = options.headerToken;
  }
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminCsrfGuard', () => {
  let guard: AdminCsrfGuard;
  let mockEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockEmitter = { emit: jest.fn() } as any;
    guard = new AdminCsrfGuard(mockEmitter);
  });

  describe('safe methods (bypass)', () => {
    it.each(['GET', 'HEAD', 'OPTIONS'])('returns true for %s method', (method) => {
      const result = guard.canActivate(makeCtx({ method }));
      expect(result).toBe(true);
      expect(mockEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('unsafe methods with valid CSRF', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('returns true for %s with matching tokens', (method) => {
      const token = 'valid-csrf-token';
      const result = guard.canActivate(
        makeCtx({ method, cookieToken: token, headerToken: token }),
      );
      expect(result).toBe(true);
    });
  });

  describe('unsafe methods with invalid CSRF', () => {
    it('throws ForbiddenException when cookie is missing', () => {
      expect(() =>
        guard.canActivate(makeCtx({ method: 'POST', headerToken: 'some-token' })),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when header is missing', () => {
      expect(() =>
        guard.canActivate(makeCtx({ method: 'POST', cookieToken: 'some-token' })),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tokens do not match', () => {
      expect(() =>
        guard.canActivate(
          makeCtx({ method: 'POST', cookieToken: 'cookie-token', headerToken: 'header-token' }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('emits security.csrf.violation event on failure', () => {
      try {
        guard.canActivate(makeCtx({ method: 'POST', cookieToken: 'a', headerToken: 'b', userId: 'user-1' }));
      } catch (_) {}
      expect(mockEmitter.emit).toHaveBeenCalledWith('security.csrf.violation', {
        userId: 'user-1',
        ipAddress: '1.2.3.4',
        resource: 'POST /admin/test',
      });
    });

    it('emits event with undefined userId when user is not set', () => {
      try {
        guard.canActivate(makeCtx({ method: 'POST', cookieToken: 'a', headerToken: 'b' }));
      } catch (_) {}
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'security.csrf.violation',
        expect.objectContaining({ userId: undefined }),
      );
    });

    it('handles array header and uses first element', () => {
      const token = 'csrf-array-token';
      const result = guard.canActivate(
        makeCtx({ method: 'POST', cookieToken: token, headerToken: [token, 'other'] }),
      );
      expect(result).toBe(true);
    });

    it('throws when array header first element does not match cookie', () => {
      expect(() =>
        guard.canActivate(
          makeCtx({ method: 'DELETE', cookieToken: 'cookie', headerToken: ['wrong', 'cookie'] }),
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
