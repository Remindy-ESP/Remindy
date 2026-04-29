import { Controller, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminAuditService } from '../../application/admin-audit.service';
import { AdminAuditQueryDto } from '../dto/admin-audit-query.dto';
import { ApiAdminAuditList } from '../../../../swagger/decorators/api-admin.decorator';

type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Audit')
@ApiBearerAuth('access-token')
@Controller('admin/audit')
@Admin()
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @ApiAdminAuditList()
  list(@Req() req: AuthReq, @Query() query: AdminAuditQueryDto) {
    return this.service.list({ role: req.user.role }, query);
  }
}
