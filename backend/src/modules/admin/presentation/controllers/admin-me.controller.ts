import { Controller, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../permissions/admin-permissions.map';
import { ApiAdminMe, ApiAdminPing } from '../../../../swagger/decorators/api-admin.decorator';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  };
};

@ApiTags('Admin / Me')
@ApiBearerAuth('access-token')
@Controller('admin')
@Admin()
export class AdminMeController {
  @ApiAdminMe()
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

  @ApiAdminPing()
  ping() {
    return { ok: true };
  }
}
