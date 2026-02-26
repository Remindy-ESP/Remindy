import { Controller, Post } from '@nestjs/common';
import { SuperAdmin } from '../decorators/super-admin.decorator';

@Controller('admin/super')
export class AdminSuperController {
  @Post('ping')
  @SuperAdmin()
  ping() {
    return { ok: true, scope: 'super_admin_only' };
  }
}
