import { Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermission, AdminPermissions } from '../presentation/permissions/admin.permissions';
import { FindAllAuditLogsUseCase } from 'src/modules/audit/application/use-cases/find-all-audit-logs.use-case';
import { AdminAuditQueryDto } from '../presentation/dto/admin-audit-query.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly findAllAuditLogs: FindAllAuditLogsUseCase) {}

  async list(actor: { role: Role }, query: AdminAuditQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.AUDIT_READ);

    return this.findAllAuditLogs.execute({
      actorUserId: query.actor,
      action: query.action,
      resourceType: query.resource,
      resourceId: query.resourceId,
      severity: query.severity,
      success: query.success,
      search: query.search,
      dateFrom: query.from ? new Date(query.from) : undefined,
      dateTo: query.to ? new Date(query.to) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
  }

  private assertPermission(role: Role, permission: AdminPermission): void {
    const perms = permissionsForRole(role);

    if (!perms.includes(permission)) {
      throw new ForbiddenException(`Permission requise : ${permission}`);
    }
  }
}
