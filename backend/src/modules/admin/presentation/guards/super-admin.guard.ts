import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const role = req.user?.role as Role | undefined;

    if (role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access only');
    }
    return true;
  }
}
