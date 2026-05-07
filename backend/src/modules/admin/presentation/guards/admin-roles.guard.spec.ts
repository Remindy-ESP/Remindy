import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRolesGuard } from './admin-roles.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

function makeCtx(role?: Role): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role !== undefined ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminRolesGuard', () => {
  let guard: AdminRolesGuard;

  beforeEach(() => {
    guard = new AdminRolesGuard();
  });

  it('returns true for USER_ADMIN role', () => {
    expect(guard.canActivate(makeCtx(Role.USER_ADMIN))).toBe(true);
  });

  it('returns true for SUPER_ADMIN role', () => {
    expect(guard.canActivate(makeCtx(Role.SUPER_ADMIN))).toBe(true);
  });

  it('throws ForbiddenException for USER_FREEMIUM role', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_FREEMIUM))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for USER_PREMIUM role', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_PREMIUM))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is undefined', () => {
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
      } as unknown as ExecutionContext),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no role', () => {
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
      } as unknown as ExecutionContext),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with correct message', () => {
    expect(() => guard.canActivate(makeCtx(Role.USER_FREEMIUM))).toThrow('Admin access only');
  });
});
