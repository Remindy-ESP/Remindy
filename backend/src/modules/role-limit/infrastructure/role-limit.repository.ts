import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleLimitRepository } from '../domain/role-limit.repository.interface';
import { RoleLimit } from '../domain/role-limit.entity';
import { RoleLimitOrmEntity } from './role-limit.orm-entity';
import { RoleLimitMapper } from './role-limit.mapper';

@Injectable()
export class RoleLimitRepository implements IRoleLimitRepository {
  constructor(
    @InjectRepository(RoleLimitOrmEntity)
    private readonly ormRepository: Repository<RoleLimitOrmEntity>,
    private readonly mapper: RoleLimitMapper,
  ) {}

  async findByRole(role: string): Promise<RoleLimit | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { role } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async save(roleLimit: RoleLimit): Promise<RoleLimit> {
    const ormEntity = this.mapper.toOrm(roleLimit);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(role: string): Promise<void> {
    await this.ormRepository.delete({ role });
  }

  async findAll(): Promise<RoleLimit[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map(entity => this.mapper.toDomain(entity));
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }

  async roleExists(role: string): Promise<boolean> {
    const count = await this.ormRepository.count({ where: { role } });
    return count > 0;
  }
}
