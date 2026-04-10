import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto';
import { ReplySupportTicketDto } from '../../application/dto/reply-support-ticket.dto';
import { MySupportTicketsQueryDto } from '../../application/dto/my-support-tickets-query.dto';
import { CreateSupportTicketUseCase } from '../../application/use-cases/create-support-ticket.use-case';
import { ListMySupportTicketsUseCase } from '../../application/use-cases/list-my-support-tickets.use-case';
import { GetMySupportTicketByIdUseCase } from '../../application/use-cases/get-my-support-ticket-by-id.use-case';
import { ReplyToMySupportTicketUseCase } from '../../application/use-cases/reply-to-my-support-ticket.use-case';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

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

  @Get('categories')
  @ApiOperation({ summary: 'Lister les catégories de tickets support' })
  getCategories() {
    return Object.values(SupportTicketCategory);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un ticket support' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupportTicketDto) {
    return this.createSupportTicketUseCase.execute({ id: req.user.id }, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lister mes tickets support' })
  listMine(@Req() req: AuthenticatedRequest, @Query() query: MySupportTicketsQueryDto) {
    return this.listMySupportTicketsUseCase.execute({ id: req.user.id }, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Voir le détail d’un de mes tickets support' })
  getMineById(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.getMySupportTicketByIdUseCase.execute({ id: req.user.id }, id);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Répondre à un de mes tickets support' })
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.replyToMySupportTicketUseCase.execute({ id: req.user.id }, id, dto);
  }
}
