import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminUsersService } from '../../application/admin-users.service';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';
import { BanUserDto } from '../dto/ban-user.dto';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';

type AuthenticatedRequest = Request & {
  user: { id: string; role: Role };
};

@ApiTags('Admin / Users')
@ApiBearerAuth('access-token')
@UseInterceptors(AuditInterceptor)
@Controller('admin/users')
@Admin()
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: AdminUsersQueryDto) {
    const actor = { id: req.user.id, role: req.user.role };
    return this.service.list(actor, query);
  }

  @Get(':id')
  getById(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    return this.service.getById(actor, id);
  }

  @Post(':id/ban')
  @Audit({
    action: 'user.ban',
    resourceType: 'user',
    resourceIdParam: 'id',
    severity: Severity.WARNING,
  })
  ban(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: BanUserDto,
  ) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.ban(actor, id, body.reason, meta);
  }

  @Post(':id/unban')
  @Audit({ action: 'user.unban', resourceType: 'user', resourceIdParam: 'id' })
  unban(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.unban(actor, id, meta);
  }

  @Post(':id/verify-email')
  @Audit({ action: 'user.verify-email', resourceType: 'user', resourceIdParam: 'id' })
  verifyEmail(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.verifyEmail(actor, id, meta);
  }

  @Post(':id/force-mfa')
  @Audit({ action: 'user.force-mfa', resourceType: 'user', resourceIdParam: 'id' })
  forceMfa(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.forceMfa(actor, id, meta);
  }

  @Post(':id/revoke-sessions')
  @Audit({ action: 'user.revoke-sessions', resourceType: 'user', resourceIdParam: 'id' })
  revokeSessions(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.revokeSessions(actor, id, meta);
  }

  @Post(':id/reset-password')
  @Audit({ action: 'user.reset-password', resourceType: 'user', resourceIdParam: 'id' })
  resetPassword(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
    return this.service.resetPassword(actor, id, meta);
  }
}
