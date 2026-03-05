import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const ADMIN_ROLES = new Set<Role>([Role.USER_ADMIN, Role.SUPER_ADMIN]);

@Injectable()
export class AdminRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: { role?: Role } }>();
    const role = req.user?.role;

    if (!role || !ADMIN_ROLES.has(role)) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
