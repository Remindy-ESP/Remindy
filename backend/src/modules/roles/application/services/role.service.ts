import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { RoleLimitRepository } from '../../infrastructure/repositories/role-limit.repository';
import { RoleEntity } from '../../../../infrastructure/database/entities/role.entity';
import { RoleLimitEntity } from '../../../../infrastructure/database/entities/role-limit.entity';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly roleLimitRepository: RoleLimitRepository,
  ) {}

  async getRoleByKey(key: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findByKey(key);

    if (!role) {
      throw new NotFoundException(`Role with key '${key}' not found`);
    }

    return role;
  }

  async getAllRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.findAll();
  }

  async getRoleLimits(roleKey: string): Promise<RoleLimitEntity> {
    // Verify role exists
    await this.getRoleByKey(roleKey);

    const limits = await this.roleLimitRepository.findByRole(roleKey);

    if (!limits) {
      throw new NotFoundException(`Limits for role '${roleKey}' not found`);
    }

    return limits;
  }

  async getAllRoleLimits(): Promise<RoleLimitEntity[]> {
    return this.roleLimitRepository.findAll();
  }

  async roleExists(key: string): Promise<boolean> {
    return this.roleRepository.exists(key);
  }
}
