import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Admin } from '../decorators/admin.decorator';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Audit } from 'src/modules/audit/presentation/decorators/audit.decorator';
import { Severity } from 'src/modules/audit/domain/enums/severity.enum';
import { AdminTicketsService } from '../../application/admin-tickets.service';
import { AdminTicketsQueryDto } from '../dto/admin-tickets-query.dto';
import { AdminReplyTicketDto } from '../dto/admin-reply-ticket.dto';

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

  @Get()
  @ApiOperation({ summary: 'Lister les tickets support' })
  list(@Query() query: AdminTicketsQueryDto) {
    return this.service.listTickets(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer le détail d’un ticket support' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getTicketById(id);
  }

  @Post(':id/reply')
  @Audit({
    action: 'support.ticket.reply',
    resourceType: 'support_ticket',
    resourceIdParam: 'id',
    severity: Severity.INFO,
  })
  @ApiOperation({ summary: 'Répondre à un ticket support' })
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminReplyTicketDto,
  ) {
    return this.service.replyToTicket(req.user.id, id, dto);
  }
}
