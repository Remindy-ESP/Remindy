import { Controller, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminDashboardService } from '../../application/admin-dashboard.service';
import { ApiAdminDashboard } from '../../../../swagger/decorators/api-admin.decorator';

type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@Admin()
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @ApiAdminDashboard()
  getOverview(@Req() req: AuthReq) {
    return this.service.getOverview({ role: req.user.role });
  }
}
