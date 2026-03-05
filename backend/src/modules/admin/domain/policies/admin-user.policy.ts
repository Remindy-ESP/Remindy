import { ForbiddenException } from '@nestjs/common';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

export function assertCanActOnUser(params: { actorRole: Role; targetRole: Role; action: string }) {
  const { actorRole, targetRole, action } = params;

  if (targetRole === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
    throw new ForbiddenException(`Not allowed to ${action} a super_admin`);
  }
}
