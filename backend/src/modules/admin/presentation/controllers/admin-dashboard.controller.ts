import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminDashboardService } from '../../application/admin-dashboard.service';

type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@Admin()
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Vue agrégée des KPIs admin' })
  getOverview(@Req() req: AuthReq) {
    return this.service.getOverview({ role: req.user.role });
  }
}
