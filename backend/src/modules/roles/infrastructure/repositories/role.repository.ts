import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../infrastructure/database/entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findByKey(key: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({
      where: { key },
    });
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find({
      order: {
        key: 'ASC',
      },
    });
  }

  async create(data: {
    key: string;
    label: string;
    description?: string;
  }): Promise<RoleEntity> {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async update(
    key: string,
    data: Partial<Pick<RoleEntity, 'label' | 'description'>>,
  ): Promise<RoleEntity | null> {
    await this.roleRepository.update({ key }, data);
    return this.findByKey(key);
  }

  async delete(key: string): Promise<void> {
    await this.roleRepository.delete({ key });
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.roleRepository.count({
      where: { key },
    });
    return count > 0;
  }
}
