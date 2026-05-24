import { Body, Controller, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto';
import { ReplySupportTicketDto } from '../../application/dto/reply-support-ticket.dto';
import { MySupportTicketsQueryDto } from '../../application/dto/my-support-tickets-query.dto';
import { CreateSupportTicketUseCase } from '../../application/use-cases/create-support-ticket.use-case';
import { ListMySupportTicketsUseCase } from '../../application/use-cases/list-my-support-tickets.use-case';
import { GetMySupportTicketByIdUseCase } from '../../application/use-cases/get-my-support-ticket-by-id.use-case';
import { ReplyToMySupportTicketUseCase } from '../../application/use-cases/reply-to-my-support-ticket.use-case';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';
import {
  ApiSupportGetCategories,
  ApiSupportCreate,
  ApiSupportListMine,
  ApiSupportGetById,
  ApiSupportReply,
} from '../../../../swagger/decorators/api-support.decorator';

type AuthenticatedRequest = Request & {
  user: { id: string };
};

@ApiTags('Support')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(
    private readonly createSupportTicketUseCase: CreateSupportTicketUseCase,
    private readonly listMySupportTicketsUseCase: ListMySupportTicketsUseCase,
    private readonly getMySupportTicketByIdUseCase: GetMySupportTicketByIdUseCase,
    private readonly replyToMySupportTicketUseCase: ReplyToMySupportTicketUseCase,
  ) {}

  @ApiSupportGetCategories()
  getCategories() {
    return Object.values(SupportTicketCategory);
  }

  @ApiSupportCreate()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupportTicketDto) {
    return this.createSupportTicketUseCase.execute({ id: req.user.id }, dto);
  }

  @ApiSupportListMine()
  listMine(@Req() req: AuthenticatedRequest, @Query() query: MySupportTicketsQueryDto) {
    return this.listMySupportTicketsUseCase.execute({ id: req.user.id }, query);
  }

  @ApiSupportGetById()
  getMineById(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.getMySupportTicketByIdUseCase.execute({ id: req.user.id }, id);
  }

  @ApiSupportReply()
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.replyToMySupportTicketUseCase.execute({ id: req.user.id }, id, dto);
  }
}
