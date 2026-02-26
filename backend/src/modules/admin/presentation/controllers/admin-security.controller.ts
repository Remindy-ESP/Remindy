import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminSecurityService } from '../../application/admin-security.service';
import { BlockIpDto } from '../dto/block-ip.dto';
import { UpdateSecurityPolicyDto } from '../dto/update-security-policy.dto';
import { SecurityLogsQueryDto } from '../dto/security-logs-query.dto';

export type AuthRequest = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Security')
@ApiBearerAuth('access-token')
@Controller('admin/security')
@Admin()
export class AdminSecurityController {
  constructor(private readonly service: AdminSecurityService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Liste des logs de sécurité avec filtres' })
  getLogs(@Query() query: SecurityLogsQueryDto) {
    return this.service.getLogs(query);
  }

  @Get('logs/suspicious')
  @ApiOperation({ summary: 'Événements suspects uniquement' })
  getSuspiciousEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.getSuspiciousEvents(+page, +limit);
  }


  @Get('blocked-ips')
  @ApiOperation({ summary: 'Liste des IPs bloquées (actives par défaut)' })
  getBlockedIps(@Query('all') all?: string) {
    return this.service.getBlockedIps(all !== 'true');
  }

  @Post('blocked-ips')
  @ApiOperation({ summary: 'Bloquer une IP — super_admin uniquement' })
  blockIp(@Req() req: AuthRequest, @Body() dto: BlockIpDto) {
    return this.service.blockIp({ id: req.user.id, role: req.user.role }, dto);
  }

  @Delete('blocked-ips/:id')
  @ApiOperation({ summary: 'Débloquer une IP — super_admin uniquement' })
  unblockIp(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.unblockIp({ id: req.user.id, role: req.user.role }, id);
  }

  @Get('ip-activity/:ip')
  @ApiOperation({ summary: 'Activité récente pour une IP donnée' })
  getIpActivity(@Param('ip') ip: string) {
    return this.service.getIpActivity(ip);
  }


  @Get('policy')
  @ApiOperation({ summary: 'Politique de sécurité actuelle' })
  getPolicy() {
    return this.service.getPolicy();
  }

  @Patch('policy')
  @ApiOperation({ summary: 'Modifier la politique — super_admin uniquement' })
  updatePolicy(@Req() req: AuthRequest, @Body() dto: UpdateSecurityPolicyDto) {
    return this.service.updatePolicy({ id: req.user.id, role: req.user.role }, dto);
  }


  @Get('stats')
  @ApiOperation({ summary: 'KPIs sécurité pour le dashboard' })
  getStats() {
    return this.service.getSecurityStats();
  }

}