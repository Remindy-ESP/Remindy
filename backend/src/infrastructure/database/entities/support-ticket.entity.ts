import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { EUser } from './user.entity';
import { SupportTicketMessageEntity } from './support-ticket-message.entity';
import { SupportTicketStatus } from '../../../modules/support/domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../../modules/support/domain/enums/support-ticket-priority.enum';
import { SupportTicketCategory } from '../../../modules/support/domain/enums/support-ticket-category.enum';

@Entity('support_tickets')
@Index('idx_support_tickets_user_id', ['userId'])
@Index('idx_support_tickets_status', ['status'])
@Index('idx_support_tickets_priority', ['priority'])
@Index('idx_support_tickets_assigned_admin_id', ['assignedAdminId'])
@Index('idx_support_tickets_created_at', ['createdAt'])
@Index('idx_support_tickets_last_reply_at', ['lastReplyAt'])
export class SupportTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  subject!: string;

  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    default: SupportTicketStatus.OPEN,
  })
  status!: SupportTicketStatus;

  @Column({
    type: 'enum',
    enum: SupportTicketPriority,
    default: SupportTicketPriority.MEDIUM,
  })
  priority!: SupportTicketPriority;

  @Column({ type: 'enum', enum: SupportTicketCategory, nullable: true })
  category!: SupportTicketCategory | null;

  @Column({ name: 'assigned_admin_id', type: 'uuid', nullable: true })
  assignedAdminId!: string | null;

  @Column({ name: 'last_reply_at', type: 'timestamptz', nullable: true })
  lastReplyAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updatedAt!: Date;

  @ManyToOne(() => EUser, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: EUser;

  @ManyToOne(() => EUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_admin_id' })
  assignedAdmin!: EUser | null;

  @OneToMany(() => SupportTicketMessageEntity, message => message.ticket)
  messages!: SupportTicketMessageEntity[];
}
