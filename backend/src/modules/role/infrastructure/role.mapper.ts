import { Injectable } from '@nestjs/common';
import { Role } from '../domain/role.entity';
import { RoleOrmEntity } from './role.orm-entity';

@Injectable()
export class RoleMapper {
  toDomain(ormEntity: RoleOrmEntity): Role {
    return new Role({
      key: ormEntity.key,
      label: ormEntity.label,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
    });
  }

  toOrm(domainEntity: Role): RoleOrmEntity {
    const ormEntity = new RoleOrmEntity();
    ormEntity.key = domainEntity.getKey();
    ormEntity.label = domainEntity.getLabel();
    ormEntity.description = domainEntity.getDescription();
    ormEntity.createdAt = domainEntity.getCreatedAt();
    return ormEntity;
  }
}
