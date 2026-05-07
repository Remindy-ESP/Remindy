import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminMfaGuard } from './admin-mfa.guard';

function makeCtx(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminMfaGuard', () => {
  let guard: AdminMfaGuard;

  beforeEach(() => {
    guard = new AdminMfaGuard();
  });

  it('throws UnauthorizedException when user is undefined', () => {
    expect(() => guard.canActivate(makeCtx(undefined))).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user is null', () => {
    expect(() => guard.canActivate(makeCtx(null))).toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException when mfaEnabled is false', () => {
    expect(() =>
      guard.canActivate(makeCtx({ mfaEnabled: false, mfaVerified: false })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with correct message when mfaEnabled is false', () => {
    expect(() =>
      guard.canActivate(makeCtx({ mfaEnabled: false, mfaVerified: false })),
    ).toThrow('MFA enrollment required for admin access');
  });

  it('throws ForbiddenException when mfaEnabled is true but mfaVerified is false', () => {
    expect(() =>
      guard.canActivate(makeCtx({ mfaEnabled: true, mfaVerified: false })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with correct message when mfaVerified is false', () => {
    expect(() =>
      guard.canActivate(makeCtx({ mfaEnabled: true, mfaVerified: false })),
    ).toThrow('MFA verification required');
  });

  it('returns true when user has mfaEnabled and mfaVerified', () => {
    const result = guard.canActivate(makeCtx({ mfaEnabled: true, mfaVerified: true }));
    expect(result).toBe(true);
  });
});
