import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EUser, UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { UserSessionEntity } from 'src/infrastructure/database/entities';
import { AdminUsersQueryDto } from '../presentation/dto/admin-users-query.dto';
import { assertCanActOnUser } from '../domain/policies/admin-user.policy';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { ForgotPasswordUseCase } from 'src/modules/auth/application/use-cases/forgot-password.use-case';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(EUser) private readonly usersRepo: Repository<EUser>,
    @InjectRepository(UserSessionEntity)
    private readonly sessionsRepo: Repository<UserSessionEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
  ) {}

  async list(actor: { id: string; role: Role }, query: AdminUsersQueryDto) {
    const qb = this.usersRepo.createQueryBuilder('u');

    if (query.q) {
      const parts = query.q.trim().split(/\s+/);
      qb.andWhere(
        new Brackets(b => {
          b.where('u.email ILIKE :q', { q: `%${query.q}%` });
          if (parts.length >= 2) {
            b.orWhere('(u.firstName ILIKE :first AND u.lastName ILIKE :last)', {
              first: `%${parts[0]}%`,
              last: `%${parts[parts.length - 1]}%`,
            });
            b.orWhere('(u.firstName ILIKE :last AND u.lastName ILIKE :first)', {
              first: `%${parts[0]}%`,
              last: `%${parts[parts.length - 1]}%`,
            });
          } else {
            b.orWhere('u.firstName ILIKE :q', { q: `%${query.q}%` }).orWhere(
              'u.lastName ILIKE :q',
              { q: `%${query.q}%` },
            );
          }
        }),
      );
    }

    if (query.role) qb.andWhere('u.role_key = :role', { role: query.role });
    if (query.status) qb.andWhere('u.status = :status', { status: query.status });
    if (query.emailVerified !== undefined)
      qb.andWhere('u.emailVerified = :ev', { ev: query.emailVerified });
    if (query.mfaEnabled !== undefined)
      qb.andWhere('u.mfaEnabled = :mfa', { mfa: query.mfaEnabled });

    qb.orderBy(`u.${query.sortBy}`, query.sortDir);
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role_key,
        status: u.status,
        emailVerified: u.emailVerified,
        mfaEnabled: u.mfaEnabled,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getById(actor: { id: string; role: Role }, id: string) {
    const user = await this.usersRepo.findOne({ where: { id }, relations: { sessions: true } });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role_key,
      status: user.status,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt,
      failedLoginCount: user.failedLoginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      sessionsCount: user.sessions?.length ?? 0,
    };
  }

  async ban(actor: { id: string; role: Role }, userId: string, reason?: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({ actorRole: actor.role, targetRole: user.role_key, action: 'ban' });

    await this.usersRepo.update(userId, { status: UserStatus.BANNED });

    this.eventEmitter.emit('security.admin.user.banned', {
      actorId: actor.id,
      targetUserId: userId,
      reason,
    });

    return { ok: true, status: UserStatus.BANNED, reason };
  }

  async unban(actor: { id: string; role: Role }, userId: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({ actorRole: actor.role, targetRole: user.role_key, action: 'unban' });

    await this.usersRepo.update(userId, { status: UserStatus.ACTIVE });

    this.eventEmitter.emit('security.admin.user.unbanned', {
      actorId: actor.id,
      targetUserId: userId,
    });

    return { ok: true, status: UserStatus.ACTIVE };
  }

  async verifyEmail(actor: { id: string; role: Role }, userId: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({
      actorRole: actor.role,
      targetRole: user.role_key,
      action: 'verify-email',
    });

    await this.usersRepo.update(userId, { emailVerified: true });
    return { ok: true, emailVerified: true };
  }

  async forceMfa(actor: { id: string; role: Role }, userId: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({ actorRole: actor.role, targetRole: user.role_key, action: 'force-mfa' });

    await this.usersRepo.update(userId, { mfaEnabled: true });
    return { ok: true, mfaEnabled: true };
  }

  async resetPassword(actor: { id: string; role: Role }, userId: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({
      actorRole: actor.role,
      targetRole: user.role_key,
      action: 'reset-password',
    });

    await this.forgotPasswordUseCase.execute(user.email);

    await this.sessionsRepo.delete({ user: { id: userId } as any });

    this.eventEmitter.emit('security.admin.user.password-reset', {
      actorId: actor.id,
      targetUserId: userId,
    });

    return { ok: true };
  }

  async revokeSessions(actor: { id: string; role: Role }, userId: string, _meta?: any) {
    const user = await this.mustGetUser(userId);
    assertCanActOnUser({
      actorRole: actor.role,
      targetRole: user.role_key,
      action: 'revoke-sessions',
    });

    await this.sessionsRepo.delete({ user: { id: userId } as any });

    this.eventEmitter.emit('security.admin.session.revoked', {
      actorId: actor.id,
      targetUserId: userId,
    });

    return { ok: true };
  }

  private async mustGetUser(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'role_key',
        'status',
        'emailVerified',
        'mfaEnabled',
        'passwordChangedAt',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
