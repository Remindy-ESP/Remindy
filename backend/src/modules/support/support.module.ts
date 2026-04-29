import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EUser,
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { SupportController } from './presentation/controllers/support.controller';
import { CreateSupportTicketUseCase } from './application/use-cases/create-support-ticket.use-case';
import { ListMySupportTicketsUseCase } from './application/use-cases/list-my-support-tickets.use-case';
import { GetMySupportTicketByIdUseCase } from './application/use-cases/get-my-support-ticket-by-id.use-case';
import { ReplyToMySupportTicketUseCase } from './application/use-cases/reply-to-my-support-ticket.use-case';
import { SupportTicketReadRepository } from './infrastructure/repositories/support-ticket-read.repository';
import { SupportTicketWriteRepository } from './infrastructure/repositories/support-ticket-write.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([EUser, SupportTicketEntity, SupportTicketMessageEntity]),
  ],
  controllers: [SupportController],
  providers: [
    SupportTicketReadRepository,
    SupportTicketWriteRepository,
    CreateSupportTicketUseCase,
    ListMySupportTicketsUseCase,
    GetMySupportTicketByIdUseCase,
    ReplyToMySupportTicketUseCase,
  ],
  exports: [],
})
export class SupportModule {}
