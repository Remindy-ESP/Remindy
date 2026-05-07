import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

function makeCtx(role?: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role !== undefined ? { role } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;

  beforeEach(() => {
    guard = new SuperAdminGuard();
  });

  it('returns true for SUPER_ADMIN role', () => {
    expect(guard.canActivate(makeCtx(Role.SUPER_ADMIN))).toBe(true);
  });

  it('throws ForbiddenException for USER_ADMIN role', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_ADMIN))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for USER_FREEMIUM role', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_FREEMIUM))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for USER_PREMIUM role', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_PREMIUM))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no role (undefined)', () => {
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with correct message', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_ADMIN))).toThrow('Super admin access only');
  });
});
