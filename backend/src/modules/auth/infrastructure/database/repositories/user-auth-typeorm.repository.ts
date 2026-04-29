import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { UserOrmMapper } from '../../mappers/user-orm.mapper';
import { AuthUser } from 'src/modules/auth/domain/entities/auth-user.entity';
import { IUserAuthRepository } from 'src/modules/auth/domain/repositories/user-auth.repository';
@Injectable()
export class UserAuthTypeOrmRepository implements IUserAuthRepository {
  constructor(
    @InjectRepository(EUser)
    private readonly repo: Repository<EUser>,
    private readonly mapper: UserOrmMapper,
  ) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const entity = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!entity) return null;
    return this.mapper.toDomain(entity);
  }

  async save(user: AuthUser): Promise<AuthUser> {
    const orm = this.mapper.toOrm(user);
    const saved = await this.repo.save(orm);
    return this.mapper.toDomain(saved);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.repo.update(
      { id: userId },
      {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
      },
    );
  }

  async incrementFailedLoginCount(userId: string): Promise<void> {
    await this.repo.increment({ id: userId }, 'failedLoginCount', 1);
  }

  async resetFailedLoginCount(userId: string): Promise<void> {
    await this.repo.update({ id: userId }, { failedLoginCount: 0 });
  }

  async updateLastLoginAt(userId: string, date: Date): Promise<void> {
    await this.repo.update({ id: userId }, { lastLoginAt: date });
  }
}
