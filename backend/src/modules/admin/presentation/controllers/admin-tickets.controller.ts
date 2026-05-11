import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Admin } from '../decorators/admin.decorator';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import { AdminTicketsService } from '../../application/admin-tickets.service';
import { AdminTicketsQueryDto } from '../dto/admin-tickets-query.dto';
import { AdminReplyTicketDto } from '../dto/admin-reply-ticket.dto';
import {
  ApiAdminTicketsList,
  ApiAdminTicketsGetById,
  ApiAdminTicketsReply,
} from '../../../../swagger/decorators/api-admin.decorator';

type AuthenticatedRequest = Request & {
  user: { id: string };
};

@ApiTags('Admin / Support')
@ApiBearerAuth('access-token')
@UseInterceptors(AuditInterceptor)
@Controller('admin/tickets')
@Admin()
export class AdminTicketsController {
  constructor(private readonly service: AdminTicketsService) {}

  @ApiAdminTicketsList()
  list(@Query() query: AdminTicketsQueryDto) {
    return this.service.listTickets(query);
  }

  @ApiAdminTicketsGetById()
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getTicketById(id);
  }

  @ApiAdminTicketsReply()
  @Audit({
    action: 'support.ticket.reply',
    resourceType: 'support_ticket',
    resourceIdParam: 'id',
    severity: Severity.INFO,
  })
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminReplyTicketDto,
  ) {
    return this.service.replyToTicket(req.user.id, id, dto);
  }
}
