import { ForbiddenException } from '@nestjs/common';
import { assertCanActOnUser } from './admin-user.policy';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

describe('assertCanActOnUser', () => {
  const userAdmin = ('user_admin' in Role ? (Role as any).user_admin : 'user_admin') as Role;
  const userRole = ('user' in Role ? (Role as any).user : 'user') as Role;

  it('throws when non-super-admin acts on a super admin', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: userAdmin,
        targetRole: Role.SUPER_ADMIN,
        action: 'ban',
      }),
    ).toThrow(ForbiddenException);
  });

  it('throws when non-super-admin acts on another admin', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: userAdmin,
        targetRole: userAdmin,
        action: 'ban',
      }),
    ).toThrow(ForbiddenException);
  });

  it('allows super-admin to act on user-admin', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.SUPER_ADMIN,
        targetRole: userAdmin,
        action: 'ban',
      }),
    ).not.toThrow();
  });

  it('allows admin actions on a normal user', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: userAdmin,
        targetRole: userRole,
        action: 'verify-email',
      }),
    ).not.toThrow();
  });
});
