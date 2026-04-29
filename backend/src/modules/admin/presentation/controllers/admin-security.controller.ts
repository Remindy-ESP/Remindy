import { Body, Controller, Param, ParseUUIDPipe, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminSecurityService } from '../../application/admin-security.service';
import { BlockIpDto } from '../dto/block-ip.dto';
import { UpdateSecurityPolicyDto } from '../dto/update-security-policy.dto';
import { SecurityLogsQueryDto } from '../dto/security-logs-query.dto';
import {
  ApiAdminSecurityGetLogs,
  ApiAdminSecurityGetSuspicious,
  ApiAdminSecurityGetBlockedIps,
  ApiAdminSecurityBlockIp,
  ApiAdminSecurityUnblockIp,
  ApiAdminSecurityGetIpActivity,
  ApiAdminSecurityGetPolicy,
  ApiAdminSecurityUpdatePolicy,
  ApiAdminSecurityGetStats,
} from '../../../../swagger/decorators/api-admin.decorator';

export type AuthRequest = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Security')
@ApiBearerAuth('access-token')
@Controller('admin/security')
@Admin()
export class AdminSecurityController {
  constructor(private readonly service: AdminSecurityService) {}

  @ApiAdminSecurityGetLogs()
  getLogs(@Query() query: SecurityLogsQueryDto) {
    return this.service.getLogs(query);
  }

  @ApiAdminSecurityGetSuspicious()
  getSuspiciousEvents(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.service.getSuspiciousEvents(+page, +limit);
  }

  @ApiAdminSecurityGetBlockedIps()
  getBlockedIps(@Query('all') all?: string) {
    return this.service.getBlockedIps(all !== 'true');
  }

  @ApiAdminSecurityBlockIp()
  blockIp(@Req() req: AuthRequest, @Body() dto: BlockIpDto) {
    return this.service.blockIp({ id: req.user.id, role: req.user.role }, dto);
  }

  @ApiAdminSecurityUnblockIp()
  unblockIp(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.unblockIp({ id: req.user.id, role: req.user.role }, id);
  }

  @ApiAdminSecurityGetIpActivity()
  getIpActivity(@Param('ip') ip: string) {
    return this.service.getIpActivity(ip);
  }

  @ApiAdminSecurityGetPolicy()
  getPolicy() {
    return this.service.getPolicy();
  }

  @ApiAdminSecurityUpdatePolicy()
  updatePolicy(@Req() req: AuthRequest, @Body() dto: UpdateSecurityPolicyDto) {
    return this.service.updatePolicy({ id: req.user.id, role: req.user.role }, dto);
  }

  @ApiAdminSecurityGetStats()
  getStats() {
    return this.service.getSecurityStats();
  }
}
