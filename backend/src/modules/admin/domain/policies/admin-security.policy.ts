import { ForbiddenException } from '@nestjs/common';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const WRITE_ACTIONS = new Set(['block-ip', 'unblock-ip', 'update-policy']);

export function assertCanActOnSecurity(params: { actorRole: Role; action: string }): void {
  const { actorRole, action } = params;

  if (WRITE_ACTIONS.has(action) && actorRole !== Role.SUPER_ADMIN) {
    throw new ForbiddenException(`Seul un super_admin peut effectuer l'action : ${action}`);
  }
}
