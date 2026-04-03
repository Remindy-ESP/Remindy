import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { RgpdExportEntity } from 'src/infrastructure/database/entities/rgpd-export.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { assertCanActOnUser } from '../domain/policies/admin-user.policy';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermission, AdminPermissions } from '../presentation/permissions/admin.permissions';
import { RgpdExportsQueryDto } from '../presentation/dto/rgpd-exports-query.dto';

const EXPORT_COOLDOWN_MINUTES = 60;

@Injectable()
export class AdminRgpdService {
  constructor(
    @InjectRepository(EUser)
    private readonly usersRepo: Repository<EUser>,

    @InjectRepository(RgpdExportEntity)
    private readonly exportsRepo: Repository<RgpdExportEntity>,
  ) {}

  async requestExport(
    actor: { id: string; role: Role },
    userId: string,
    meta?: { ipAddress?: string },
  ): Promise<RgpdExportEntity> {
    this.assertPermission(actor.role, AdminPermissions.RGPD_EXPORT);
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({ actorRole: actor.role, targetRole: user.role_key, action: 'rgpd-export' });

    const existing = await this.exportsRepo.findOne({
      where: [
        { userId, status: 'pending' },
        { userId, status: 'processing' },
      ],
    });

    if (existing) {
      throw new ConflictException(
        `An export is already in progress for this user (id: ${existing.id})`,
      );
    }

    const cooldownDate = new Date(Date.now() - EXPORT_COOLDOWN_MINUTES * 60 * 1000);
    const recent = await this.exportsRepo
      .createQueryBuilder('e')
      .where('e.userId = :userId', { userId })
      .andWhere('e.requestedBy = :by', { by: 'admin' })
      .andWhere('e.createdAt > :since', { since: cooldownDate })
      .getOne();

    if (recent) {
      throw new ConflictException(
        `An export was already requested less than ${EXPORT_COOLDOWN_MINUTES} minutes ago (id: ${recent.id})`,
      );
    }

    const export_ = this.exportsRepo.create({
      userId,
      status: 'pending',
      format: 'json',
      requestedBy: 'admin',
      ipAddress: meta?.ipAddress,
    });

    return this.exportsRepo.save(export_);
  }

  async listExports(actor: { id: string; role: Role }, query: RgpdExportsQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.RGPD_EXPORT);
    const qb = this.exportsRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .orderBy('e.createdAt', 'DESC');

    if (query.userId) {
      qb.andWhere('e.userId = :userId', { userId: query.userId });
    }

    if (query.status) {
      qb.andWhere('e.status = :status', { status: query.status });
    }

    if (query.requestedBy) {
      qb.andWhere('e.requestedBy = :requestedBy', { requestedBy: query.requestedBy });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(e => this.serializeExport(e)),
      total,
      page,
      limit,
    };
  }

  async deleteUserData(
    actor: { id: string; role: Role },
    userId: string,
    _meta?: { ipAddress?: string },
  ): Promise<{ ok: boolean; userId: string; deletedAt: Date }> {
    this.assertPermission(actor.role, AdminPermissions.RGPD_DELETE);
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({ actorRole: actor.role, targetRole: user.role_key, action: 'rgpd-delete' });

    const deletedAt = new Date();

    await this.usersRepo
      .createQueryBuilder()
      .update(EUser)
      .set({
        email: () => `'deleted+${userId}@remindy.invalid'`,
        firstName: () => 'NULL',
        lastName: () => 'NULL',
        phone: () => 'NULL',
        photoR2Key: () => 'NULL',
        passwordHash: () => 'NULL',
        mfaSecret: () => 'NULL',
        deletedAt: () => 'NOW()',
      })
      .where('id = :id', { id: userId })
      .execute();

    return { ok: true, userId, deletedAt };
  }

  private assertPermission(role: Role, permission: AdminPermission): void {
    const perms = permissionsForRole(role);
    if (!perms.includes(permission)) {
      throw new ForbiddenException(`Permission requise : ${permission}`);
    }
  }

  private async mustGetUser(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: ['id', 'role_key'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private serializeExport(e: RgpdExportEntity) {
    return {
      id: e.id,
      userId: e.userId,
      userEmail: e.user?.email ?? null,
      status: e.status,
      format: e.format,
      requestedBy: e.requestedBy,
      fileSize: e.fileSize ? Number(e.fileSize) : null,
      signedUrl: e.signedUrl ?? null,
      expiresAt: e.expiresAt ?? null,
      errorMessage: e.errorMessage ?? null,
      ipAddress: e.ipAddress ?? null,
      createdAt: e.createdAt,
      completedAt: e.completedAt ?? null,
    };
  }
}
