import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdmin } from '../decorators/super-admin.decorator';
import { ApiAdminSuperPing } from '../../../../swagger/decorators/api-admin.decorator';

@ApiTags('Admin / Super')
@ApiBearerAuth('access-token')
@Controller('admin/super')
export class AdminSuperController {
  @ApiAdminSuperPing()
  @SuperAdmin()
  ping() {
    return { ok: true, scope: 'super_admin_only' };
  }
}
