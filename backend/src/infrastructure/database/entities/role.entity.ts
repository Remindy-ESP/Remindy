import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryColumn({ type: 'text' })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
