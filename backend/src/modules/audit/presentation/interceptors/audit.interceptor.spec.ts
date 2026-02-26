import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { AUDIT_KEY, AuditConfig } from '../decorators/audit.decorator';
import { Severity } from '../../domain/enums/severity.enum';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let createAuditLogUseCase: jest.Mocked<CreateAuditLogUseCase>;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    createAuditLogUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogUseCase>;

    createAuditLogUseCase.execute.mockResolvedValue({} as any);

    interceptor = new AuditInterceptor(reflector, createAuditLogUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createContext = (requestOverrides: Partial<any> = {}): ExecutionContext => {
    const request = {
      method: 'POST',
      params: {},
      body: {},
      headers: {},
      socket: { remoteAddress: '10.0.0.1' },
      ip: '10.0.0.2',
      ...requestOverrides,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}) as any,
    } as ExecutionContext;
  };

  const createHandler = (observableFactory: () => any): CallHandler => ({
    handle: observableFactory,
  });

  it('should skip audit logging when no @Audit metadata is present', async () => {
    reflector.get.mockReturnValue(undefined);

    const context = createContext();
    const next = createHandler(() => of({ ok: true }));

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ ok: true });
    expect(reflector.get).toHaveBeenCalledWith(AUDIT_KEY, expect.anything());
    expect(createAuditLogUseCase.execute).not.toHaveBeenCalled();
  });

  it('should create audit log on success with before/after capture and sanitization', async () => {
    const config: AuditConfig = {
      action: 'user.update',
      resourceType: 'user',
      resourceIdParam: 'id',
      severity: Severity.INFO,
    };
    reflector.get.mockReturnValue(config);

    const context = createContext({
      method: 'PUT',
      params: { id: 'user-123' },
      body: {
        firstName: 'John',
        password: 'secret-value',
        nested: { refreshToken: 'abc', safe: 'ok' },
      },
      headers: {
        'user-agent': 'jest-agent',
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      },
      user: { userId: 'admin-1' },
    });
    const next = createHandler(() =>
      of({
        id: 'user-123',
        accessToken: 'should-hide',
        profile: { email: 'user@test.com' },
      }),
    );

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      id: 'user-123',
      accessToken: 'should-hide',
      profile: { email: 'user@test.com' },
    });

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'user.update',
        resourceType: 'user',
        resourceId: 'user-123',
        ipAddress: '203.0.113.10',
        userAgent: 'jest-agent',
        severity: Severity.INFO,
        success: true,
        errorMessage: null,
        before: {
          firstName: 'John',
          password: '[REDACTED]',
          nested: { refreshToken: '[REDACTED]', safe: 'ok' },
        },
        after: {
          id: 'user-123',
          accessToken: '[REDACTED]',
          profile: { email: 'user@test.com' },
        },
      }),
    );
  });

  it('should log failed audit entry on error and rethrow', async () => {
    reflector.get.mockReturnValue({
      action: 'user.delete',
      resourceType: 'user',
      resourceIdParam: 'id',
    } satisfies AuditConfig);

    const context = createContext({
      method: 'DELETE',
      params: { id: 'user-999' },
      headers: { 'x-real-ip': '198.51.100.1' },
      user: { userId: 'admin-2' },
    });

    const error = new Error('Delete failed');
    const next = createHandler(() => throwError(() => error));

    await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toThrow(
      'Delete failed',
    );

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-2',
        action: 'user.delete',
        resourceType: 'user',
        resourceId: 'user-999',
        ipAddress: '198.51.100.1',
        success: false,
        severity: Severity.WARNING,
        errorMessage: 'Delete failed',
        before: {
          params: { id: 'user-999' },
        },
        after: null,
      }),
    );
  });

  it('should extract resourceId from body when configured', async () => {
    reflector.get.mockReturnValue({
      action: 'subscription.create',
      resourceType: 'subscription',
      resourceIdBody: 'id',
    } satisfies AuditConfig);

    const context = createContext({
      method: 'POST',
      body: { id: 42, name: 'Netflix' },
    });

    const next = createHandler(() => of({ created: true }));

    await lastValueFrom(interceptor.intercept(context, next));

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: '42',
      }),
    );
  });

  it('should use socket/ip fallback when no forwarded headers are present', async () => {
    reflector.get.mockReturnValue({
      action: 'audit.read',
      resourceType: 'audit',
    } satisfies AuditConfig);

    const context = createContext({
      method: 'GET',
      body: undefined,
      params: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.5' },
      ip: '127.0.0.6',
    });

    const next = createHandler(() => of({ result: 'ok' }));

    await lastValueFrom(interceptor.intercept(context, next));

    expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '127.0.0.5',
        before: null,
        after: { result: 'ok' },
      }),
    );
  });

  it('should not break request flow if audit log creation fails asynchronously', async () => {
    reflector.get.mockReturnValue({
      action: 'user.read',
      resourceType: 'user',
    } satisfies AuditConfig);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    createAuditLogUseCase.execute.mockRejectedValueOnce(new Error('audit write failed'));

    const context = createContext({ method: 'GET' });
    const next = createHandler(() => of({ ok: true }));

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ ok: true });

    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create audit log:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
