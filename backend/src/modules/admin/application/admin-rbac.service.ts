import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from 'src/infrastructure/database/entities/role.entity';
import { RolePermissionEntity } from 'src/infrastructure/database/entities/role-permission.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermissions } from '../presentation/permissions/admin.permissions';
import { CreateRoleDto, UpdateRoleDto } from '../presentation/dto/admin-rbac.dto';

const SYSTEM_ROLES = new Set<string>([Role.SUPER_ADMIN, Role.USER_ADMIN]);

@Injectable()
export class AdminRbacService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly rolesRepo: Repository<RoleEntity>,

    @InjectRepository(RolePermissionEntity)
    private readonly permissionsRepo: Repository<RolePermissionEntity>,
  ) {}

  async listRoles(actor: { role: Role }) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_READ);

    const [roles, pivotRows] = await Promise.all([
      this.rolesRepo.find({ order: { createdAt: 'ASC' } }),
      this.permissionsRepo.find(),
    ]);

    const permsByRole = this.groupPermissions(pivotRows);

    return roles.map(r => this.serialize(r, permsByRole[r.key] ?? []));
  }

  async createRole(actor: { role: Role }, dto: CreateRoleDto) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_WRITE);

    const exists = await this.rolesRepo.findOne({ where: { key: dto.key } });
    if (exists) {
      throw new ConflictException(`Un rôle avec la clé "${dto.key}" existe déjà`);
    }

    const role = this.rolesRepo.create({
      key: dto.key,
      label: dto.label,
      description: dto.description,
    });

    return this.serialize(await this.rolesRepo.save(role), []);
  }

  async updateRole(actor: { role: Role }, key: string, dto: UpdateRoleDto) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_WRITE);
    this.assertNotSystemRole(key);

    const role = await this.mustGetRole(key);

    if (dto.label !== undefined) role.label = dto.label;
    if (dto.description !== undefined) role.description = dto.description;

    const permissions = await this.permissionsRepo.find({ where: { roleKey: key } });

    return this.serialize(
      await this.rolesRepo.save(role),
      permissions.map(p => p.permission),
    );
  }

  async deleteRole(actor: { role: Role }, key: string) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_WRITE);
    this.assertNotSystemRole(key);

    const role = await this.mustGetRole(key);

    await this.rolesRepo.remove(role);

    return { ok: true, key };
  }

  async addPermission(actor: { role: Role }, key: string, permission: string) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_WRITE);
    await this.mustGetRole(key);
    this.assertValidPermission(permission);

    const existing = await this.permissionsRepo.findOne({
      where: { roleKey: key, permission },
    });

    if (existing) {
      throw new ConflictException(
        `La permission "${permission}" est déjà assignée au rôle "${key}"`,
      );
    }

    await this.permissionsRepo.save(this.permissionsRepo.create({ roleKey: key, permission }));

    const all = await this.permissionsRepo.find({ where: { roleKey: key } });

    return {
      key,
      permissions: all.map(p => p.permission),
    };
  }

  async removePermission(actor: { role: Role }, key: string, permission: string) {
    this.assertPermission(actor.role, AdminPermissions.RBAC_WRITE);
    await this.mustGetRole(key);
    this.assertValidPermission(permission);

    const existing = await this.permissionsRepo.findOne({
      where: { roleKey: key, permission },
    });

    if (!existing) {
      throw new NotFoundException(
        `La permission "${permission}" n'est pas assignée au rôle "${key}"`,
      );
    }

    await this.permissionsRepo.remove(existing);

    const remaining = await this.permissionsRepo.find({ where: { roleKey: key } });

    return {
      key,
      permissions: remaining.map(p => p.permission),
    };
  }

  private assertPermission(role: Role, permission: string): void {
    const perms = permissionsForRole(role);
    if (!perms.includes(permission as any)) {
      throw new ForbiddenException(`Permission requise : ${permission}`);
    }
  }

  private assertNotSystemRole(key: string): void {
    if (SYSTEM_ROLES.has(key)) {
      throw new BadRequestException(
        `Le rôle système "${key}" ne peut pas être modifié ou supprimé`,
      );
    }
  }

  private assertValidPermission(permission: string): void {
    const allPerms = Object.values(AdminPermissions) as string[];
    if (!allPerms.includes(permission)) {
      throw new BadRequestException(
        `Permission inconnue : "${permission}". Valeurs acceptées : ${allPerms.join(', ')}`,
      );
    }
  }

  private async mustGetRole(key: string): Promise<RoleEntity> {
    const role = await this.rolesRepo.findOne({ where: { key } });
    if (!role) throw new NotFoundException(`Rôle introuvable : ${key}`);
    return role;
  }

  private groupPermissions(rows: RolePermissionEntity[]): Record<string, string[]> {
    return rows.reduce<Record<string, string[]>>((acc, row) => {
      (acc[row.roleKey] ??= []).push(row.permission);
      return acc;
    }, {});
  }

  private serialize(role: RoleEntity, permissions: string[]) {
    return {
      key: role.key,
      label: role.label,
      description: role.description ?? null,
      isSystem: SYSTEM_ROLES.has(role.key),
      permissions,
      createdAt: role.createdAt,
    };
  }
}
