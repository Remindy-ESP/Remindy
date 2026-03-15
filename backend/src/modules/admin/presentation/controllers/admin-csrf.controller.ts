import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Res } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AdminPreMfa } from '../decorators/admin-pre-mfa.decorator';

@ApiTags('Admin Auth')
@ApiBearerAuth('access-token')
@Controller('admin/auth')
export class AdminCsrfController {
  @Get('csrf')
  @AdminPreMfa()
  csrf(@Res({ passthrough: true }) res: any) {
    const token = randomBytes(32).toString('hex');

    res.cookie('csrfToken', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
    });

    return { csrfToken: token };
  }
  @Post('ping')
  @AdminPreMfa()
  ping() {
    return { ok: true };
  }
}
