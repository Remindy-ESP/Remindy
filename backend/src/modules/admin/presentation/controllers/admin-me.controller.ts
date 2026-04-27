import { Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../permissions/admin-permissions.map';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  };
};

@Controller('admin')
@Admin()
export class AdminMeController {
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    const role = req.user.role;

    return {
      id: req.user.id,
      role,
      mfaEnabled: req.user.mfaEnabled,
      mfaVerified: req.user.mfaVerified,
      permissions: permissionsForRole(role),
    };
  }
  @Post('ping')
  ping() {
    return { ok: true };
  }
}
