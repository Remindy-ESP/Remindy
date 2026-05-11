import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Admin } from '../decorators/admin.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminCloudService } from '../../application/admin-cloud.service';
import { AdminDocumentsQueryDto } from '../dto/admin-documents-query.dto';
import { AdminSubscriptionsQueryDto } from '../dto/admin-subscriptions-query.dto';
import { UpdateSharedSubscriptionDto } from '../dto/update-shared-subscription.dto';
import { AdminReprocessOcrDto } from '../dto/admin-reprocess-ocr.dto';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import {
  ApiAdminCloudListSubscriptions,
  ApiAdminCloudUpdateSharedSubscription,
  ApiAdminCloudListDocuments,
  ApiAdminCloudReprocessOcr,
} from '../../../../swagger/decorators/api-admin.decorator';

type AuthReq = Request & { user: { id: string; role: Role } };

@ApiTags('Admin / Cloud')
@ApiBearerAuth('access-token')
@UseInterceptors(AuditInterceptor)
@Controller('admin')
@Admin()
export class AdminCloudController {
  constructor(private readonly service: AdminCloudService) {}

  @ApiAdminCloudListSubscriptions()
  listSubscriptions(@Req() req: AuthReq, @Query() query: AdminSubscriptionsQueryDto) {
    return this.service.listSubscriptions({ role: req.user.role }, query);
  }

  @ApiAdminCloudUpdateSharedSubscription()
  @Audit({
    action: 'subscription.update-shared',
    resourceType: 'subscription',
    resourceIdParam: 'id',
  })
  updateSharedSubscription(
    @Req() req: AuthReq,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSharedSubscriptionDto,
  ) {
    return this.service.updateSharedSubscription({ role: req.user.role }, id, body);
  }

  @ApiAdminCloudListDocuments()
  listDocuments(@Req() req: AuthReq, @Query() query: AdminDocumentsQueryDto) {
    return this.service.listDocuments({ role: req.user.role }, query);
  }

  @ApiAdminCloudReprocessOcr()
  @Audit({
    action: 'document.reprocess-ocr',
    resourceType: 'document',
    resourceIdParam: 'id',
    severity: Severity.WARNING,
  })
  reprocessOcr(
    @Req() req: AuthReq,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminReprocessOcrDto,
  ) {
    return this.service.reprocessOcr({ role: req.user.role }, id, body.force ?? false);
  }
}
