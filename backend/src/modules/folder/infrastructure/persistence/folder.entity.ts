import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { DocumentEntity } from '../../../document/infrastructure/persistence/document.entity';

/**
 * Folder TypeORM Entity (Persistence Layer)
 * Représente la table "folders" en base de données
 */
@Entity('folders')
@Index(['userId', 'deletedAt'])
@Index(['parentId'])
@Index(['name'])
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // === Relations ===

  /**
   * Relation parent-enfant (auto-référence)
   */
  @ManyToOne(() => FolderEntity, folder => folder.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: FolderEntity;

  /**
   * Sous-dossiers
   */
  @OneToMany(() => FolderEntity, folder => folder.parent)
  children?: FolderEntity[];

  /**
   * Documents contenus dans ce dossier
   */
  @OneToMany(() => DocumentEntity, document => document.folder)
  documents?: DocumentEntity[];
}
