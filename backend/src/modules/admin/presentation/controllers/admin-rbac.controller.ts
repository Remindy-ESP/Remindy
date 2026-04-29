import { Body, Controller, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminRbacService } from '../../application/admin-rbac.service';
import { CreateRoleDto, UpdateRoleDto, RolePermissionDto } from '../dto/admin-rbac.dto';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import {
  ApiAdminRbacList,
  ApiAdminRbacCreate,
  ApiAdminRbacUpdate,
  ApiAdminRbacDelete,
  ApiAdminRbacAddPermission,
  ApiAdminRbacRemovePermission,
} from '../../../../swagger/decorators/api-admin.decorator';

type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / RBAC')
@ApiBearerAuth('access-token')
@UseInterceptors(AuditInterceptor)
@Controller('admin/roles')
@Admin()
export class AdminRbacController {
  constructor(private readonly service: AdminRbacService) {}

  @ApiAdminRbacList()
  listRoles(@Req() req: AuthReq) {
    return this.service.listRoles({ role: req.user.role });
  }

  @ApiAdminRbacCreate()
  @Audit({ action: 'role.create', resourceType: 'role', resourceIdBody: 'key' })
  createRole(@Req() req: AuthReq, @Body() body: CreateRoleDto) {
    return this.service.createRole({ role: req.user.role }, body);
  }

  @ApiAdminRbacUpdate()
  @Audit({ action: 'role.update', resourceType: 'role', resourceIdParam: 'id' })
  updateRole(@Req() req: AuthReq, @Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.service.updateRole({ role: req.user.role }, id, body);
  }

  @ApiAdminRbacDelete()
  @Audit({
    action: 'role.delete',
    resourceType: 'role',
    resourceIdParam: 'id',
    severity: Severity.WARNING,
  })
  deleteRole(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteRole({ role: req.user.role }, id);
  }

  @ApiAdminRbacAddPermission()
  @Audit({ action: 'role.permission.add', resourceType: 'role', resourceIdParam: 'id' })
  addPermission(@Req() req: AuthReq, @Param('id') id: string, @Body() body: RolePermissionDto) {
    return this.service.addPermission({ role: req.user.role }, id, body.permission);
  }

  @ApiAdminRbacRemovePermission()
  @Audit({
    action: 'role.permission.remove',
    resourceType: 'role',
    resourceIdParam: 'id',
    severity: Severity.WARNING,
  })
  removePermission(@Req() req: AuthReq, @Param('id') id: string, @Body() body: RolePermissionDto) {
    return this.service.removePermission({ role: req.user.role }, id, body.permission);
  }
}
