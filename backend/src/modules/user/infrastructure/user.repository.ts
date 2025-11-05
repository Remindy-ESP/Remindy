import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { User } from '../domain/user.entity';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';

/**
 * User Repository Implementation (Adapter)
 * Implémente IUserRepository avec TypeORM
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async save(user: User): Promise<User> {
    // Chercher si l'entité existe déjà
    const existingOrmEntity = await this.ormRepository.findOne({
      where: { id: user.getId() },
    });

    let savedOrmEntity: UserOrmEntity;

    if (existingOrmEntity) {
      // Update: merge les changements dans l'entité existante
      const updatedOrmEntity = this.mapper.toOrmPartial(user, existingOrmEntity);
      savedOrmEntity = await this.ormRepository.save(updatedOrmEntity);
    } else {
      // Create: nouvelle entité
      const newOrmEntity = this.mapper.toOrm(user);
      savedOrmEntity = await this.ormRepository.save(newOrmEntity);
    }

    return this.mapper.toDomain(savedOrmEntity);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    includeDeleted?: boolean;
  }): Promise<{ users: User[]; total: number }> {
    const where = options?.includeDeleted ? {} : { deletedAt: IsNull() };

    const [ormEntities, total] = await this.ormRepository.findAndCount({
      where,
      skip: options?.skip,
      take: options?.take,
      order: { createdAt: 'DESC' },
    });

    const users = ormEntities.map(ormEntity => this.mapper.toDomain(ormEntity));

    return { users, total };
  }

  async count(options?: { includeDeleted?: boolean }): Promise<number> {
    const where = options?.includeDeleted ? {} : { deletedAt: IsNull() };
    return await this.ormRepository.count({ where });
  }

  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    interface WhereCondition {
      email: string;
      deletedAt: any;
      id?: any;
    }

    const where: WhereCondition = {
      email: email.toLowerCase(),
      deletedAt: IsNull(),
    };

    if (excludeUserId) {
      where.id = Not(excludeUserId);
    }

    const count = await this.ormRepository.count({ where });
    return count > 0;
  }
}
