import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository } from '../domain/role.repository.interface';
import { Role } from '../domain/role.entity';
import { RoleOrmEntity } from './role.orm-entity';
import { RoleMapper } from './role.mapper';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly ormRepository: Repository<RoleOrmEntity>,
    private readonly mapper: RoleMapper,
  ) {}

  async findByKey(key: string): Promise<Role | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { key } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async save(role: Role): Promise<Role> {
    const ormEntity = this.mapper.toOrm(role);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(key: string): Promise<void> {
    await this.ormRepository.delete({ key });
  }

  async findAll(): Promise<Role[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map(entity => this.mapper.toDomain(entity));
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }

  async keyExists(key: string): Promise<boolean> {
    const count = await this.ormRepository.count({ where: { key } });
    return count > 0;
  }
}
