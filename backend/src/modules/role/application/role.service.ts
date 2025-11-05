import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import type { IRoleRepository } from '../domain/role.repository.interface';
import { ROLE_REPOSITORY } from '../domain/role.repository.interface';
import { Role } from '../domain/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Generate a key from the label (lowercase, replace spaces with underscores)
    const key = createRoleDto.label.toLowerCase().replace(/\s+/g, '_');

    // Check if key already exists
    const keyExists = await this.roleRepository.keyExists(key);
    if (keyExists) {
      throw new ConflictException(`Role with key '${key}' already exists`);
    }

    // Create role entity
    const role = new Role({
      key,
      label: createRoleDto.label,
      description: createRoleDto.description ?? null,
    });

    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async findOne(key: string): Promise<Role> {
    const role = await this.roleRepository.findByKey(key);
    if (!role) {
      throw new NotFoundException(`Role with key '${key}' not found`);
    }
    return role;
  }

  async update(key: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(key);

    if (updateRoleDto.label !== undefined) {
      role.updateLabel(updateRoleDto.label);
    }

    if (updateRoleDto.description !== undefined) {
      role.updateDescription(updateRoleDto.description);
    }

    return this.roleRepository.save(role);
  }

  async remove(key: string): Promise<void> {
    const role = await this.findOne(key);
    await this.roleRepository.delete(role.getKey());
  }

  async count(): Promise<number> {
    return this.roleRepository.count();
  }
}
