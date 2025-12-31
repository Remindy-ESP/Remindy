import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  icon: string;

  @Column({ type: 'varchar', length: 7 })
  color: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => EUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: EUser;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
