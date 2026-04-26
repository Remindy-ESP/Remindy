import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EUser } from './user.entity';
import { SupportTicketEntity } from './support-ticket.entity';
import { SupportTicketAuthorType } from '../../../modules/support/domain/enums/support-ticket-author-type.enum';

@Entity('support_ticket_messages')
@Index('idx_support_ticket_messages_ticket_id', ['ticketId'])
@Index('idx_support_ticket_messages_author_type', ['authorType'])
@Index('idx_support_ticket_messages_created_at', ['createdAt'])
export class SupportTicketMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: false })
  ticketId!: string;

  @Column({
    name: 'author_type',
    type: 'enum',
    enum: SupportTicketAuthorType,
    nullable: false,
  })
  authorType!: SupportTicketAuthorType;

  @Column({ name: 'author_user_id', type: 'uuid', nullable: true })
  authorUserId!: string | null;

  @Column({ name: 'author_admin_id', type: 'uuid', nullable: true })
  authorAdminId!: string | null;

  @Column({ type: 'text', nullable: false })
  body!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @ManyToOne(() => SupportTicketEntity, ticket => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: SupportTicketEntity;

  @ManyToOne(() => EUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_user_id' })
  authorUser!: EUser | null;

  @ManyToOne(() => EUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_admin_id' })
  authorAdmin!: EUser | null;
}
