import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleLimitEntity } from '../../../../infrastructure/database/entities/role-limit.entity';

@Injectable()
export class RoleLimitRepository {
  constructor(
    @InjectRepository(RoleLimitEntity)
    private readonly roleLimitRepository: Repository<RoleLimitEntity>,
  ) {}

  async findByRole(role: string): Promise<RoleLimitEntity | null> {
    return this.roleLimitRepository.findOne({
      where: { role },
    });
  }

  async findAll(): Promise<RoleLimitEntity[]> {
    return this.roleLimitRepository.find({
      order: {
        role: 'ASC',
      },
    });
  }

  async create(data: {
    role: string;
    maxSubscriptions?: number;
    maxDocuments?: number;
    maxDocumentSizeMb?: number;
    maxRemindersPerSubscription?: number;
    canExportData?: boolean;
    canUseOcr?: boolean;
  }): Promise<RoleLimitEntity> {
    const limit = this.roleLimitRepository.create(data);
    return this.roleLimitRepository.save(limit);
  }

  async update(
    role: string,
    data: Partial<Omit<RoleLimitEntity, 'role' | 'createdAt' | 'updatedAt' | 'roleEntity'>>,
  ): Promise<RoleLimitEntity | null> {
    await this.roleLimitRepository.update({ role }, data);
    return this.findByRole(role);
  }

  async delete(role: string): Promise<void> {
    await this.roleLimitRepository.delete({ role });
  }
}
