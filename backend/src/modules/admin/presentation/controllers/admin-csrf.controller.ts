import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Res } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AdminPreMfa } from '../decorators/admin-pre-mfa.decorator';
import { ApiAdminCsrf, ApiAdminAuthPing } from '../../../../swagger/decorators/api-admin.decorator';

@ApiTags('Admin Auth')
@ApiBearerAuth('access-token')
@Controller('admin/auth')
export class AdminCsrfController {
  @ApiAdminCsrf()
  @AdminPreMfa()
  csrf(@Res({ passthrough: true }) res: any) {
    const token = randomBytes(32).toString('hex');

    res.cookie('csrfToken', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { csrfToken: token };
  }

  @ApiAdminAuthPing()
  @AdminPreMfa()
  ping() {
    return { ok: true };
  }
}
