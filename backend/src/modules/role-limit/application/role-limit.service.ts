import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import type { IRoleLimitRepository } from '../domain/role-limit.repository.interface';
import { ROLE_LIMIT_REPOSITORY } from '../domain/role-limit.repository.interface';
import { RoleLimit } from '../domain/role-limit.entity';
import { CreateRoleLimitDto } from './dto/create-role-limit.dto';
import { UpdateRoleLimitDto } from './dto/update-role-limit.dto';

@Injectable()
export class RoleLimitService {
  constructor(
    @Inject(ROLE_LIMIT_REPOSITORY)
    private readonly roleLimitRepository: IRoleLimitRepository,
  ) {}

  async create(createRoleLimitDto: CreateRoleLimitDto): Promise<RoleLimit> {
    // Check if role limit already exists
    const roleExists = await this.roleLimitRepository.roleExists(createRoleLimitDto.role);
    if (roleExists) {
      throw new ConflictException(
        `Role limit for role '${createRoleLimitDto.role}' already exists`,
      );
    }

    // Create role limit entity
    const roleLimit = new RoleLimit({
      role: createRoleLimitDto.role,
      maxSubscriptions: createRoleLimitDto.maxSubscriptions ?? null,
      maxDocuments: createRoleLimitDto.maxDocuments ?? null,
      maxDocumentSizeMb: createRoleLimitDto.maxDocumentSizeMb ?? null,
      maxRemindersPerSubscription: createRoleLimitDto.maxRemindersPerSubscription ?? null,
      canExportData: createRoleLimitDto.canExportData ?? true,
      canUseOcr: createRoleLimitDto.canUseOcr ?? true,
    });

    return this.roleLimitRepository.save(roleLimit);
  }

  async findAll(): Promise<RoleLimit[]> {
    return this.roleLimitRepository.findAll();
  }

  async findOne(role: string): Promise<RoleLimit> {
    const roleLimit = await this.roleLimitRepository.findByRole(role);
    if (!roleLimit) {
      throw new NotFoundException(`Role limit for role '${role}' not found`);
    }
    return roleLimit;
  }

  async update(role: string, updateRoleLimitDto: UpdateRoleLimitDto): Promise<RoleLimit> {
    const roleLimit = await this.findOne(role);

    // Create a new RoleLimit with updated values
    const updatedRoleLimit = new RoleLimit({
      role: roleLimit.getRole(),
      maxSubscriptions:
        updateRoleLimitDto.maxSubscriptions !== undefined
          ? updateRoleLimitDto.maxSubscriptions
          : roleLimit.getMaxSubscriptions(),
      maxDocuments:
        updateRoleLimitDto.maxDocuments !== undefined
          ? updateRoleLimitDto.maxDocuments
          : roleLimit.getMaxDocuments(),
      maxDocumentSizeMb:
        updateRoleLimitDto.maxDocumentSizeMb !== undefined
          ? updateRoleLimitDto.maxDocumentSizeMb
          : roleLimit.getMaxDocumentSizeMb(),
      maxRemindersPerSubscription:
        updateRoleLimitDto.maxRemindersPerSubscription !== undefined
          ? updateRoleLimitDto.maxRemindersPerSubscription
          : roleLimit.getMaxRemindersPerSubscription(),
      canExportData:
        updateRoleLimitDto.canExportData !== undefined
          ? updateRoleLimitDto.canExportData
          : roleLimit.canExport(),
      canUseOcr:
        updateRoleLimitDto.canUseOcr !== undefined
          ? updateRoleLimitDto.canUseOcr
          : roleLimit.canOcr(),
      createdAt: roleLimit.getCreatedAt(),
      updatedAt: new Date(),
    });

    return this.roleLimitRepository.save(updatedRoleLimit);
  }

  async remove(role: string): Promise<void> {
    const roleLimit = await this.findOne(role);
    await this.roleLimitRepository.delete(roleLimit.getRole());
  }

  async count(): Promise<number> {
    return this.roleLimitRepository.count();
  }
}
