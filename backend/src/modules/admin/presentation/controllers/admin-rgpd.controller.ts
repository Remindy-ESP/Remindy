import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminRgpdService } from '../../application/admin-rgpd.service';
import { RgpdExportsQueryDto } from '../dto/rgpd-exports-query.dto';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';
type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / RGPD')
@ApiBearerAuth('access-token')
@UseInterceptors(AuditInterceptor)
@Controller('admin/rgpd')
@Admin()
export class AdminRgpdController {
  constructor(private readonly service: AdminRgpdService) {}

  @Post('exports/:userId')
  @ApiOperation({ summary: 'Demander un export RGPD pour un utilisateur' })
  @Audit({
    action: 'rgpd.export-request',
    resourceType: 'user',
    resourceIdParam: 'userId',
    severity: Severity.WARNING,
  })
  requestExport(@Req() req: AuthReq, @Param('userId', new ParseUUIDPipe()) userId: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip };
    return this.service.requestExport(actor, userId, meta);
  }

  @Get('exports')
  @ApiOperation({ summary: 'Lister les exports RGPD' })
  listExports(@Req() req: AuthReq, @Query() query: RgpdExportsQueryDto) {
    const actor = { id: req.user.id, role: req.user.role };
    return this.service.listExports(actor, query);
  }

  @Post('delete/:userId')
  @ApiOperation({ summary: "Supprimer (anonymiser) les données RGPD d'un utilisateur" })
  @Audit({
    action: 'rgpd.delete',
    resourceType: 'user',
    resourceIdParam: 'userId',
    severity: Severity.CRITICAL,
  })
  deleteUserData(@Req() req: AuthReq, @Param('userId', new ParseUUIDPipe()) userId: string) {
    const actor = { id: req.user.id, role: req.user.role };
    const meta = { ipAddress: req.ip };
    return this.service.deleteUserData(actor, userId, meta);
  }
}
