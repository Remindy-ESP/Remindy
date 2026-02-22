import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-user.repository';

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
  ) {}

  async findByIdWithPreferences(id: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['preferences'],
    });
  }

  async findByEmail(email: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: IsNull(),
      },
    });
  }

  async findById(id: string): Promise<EUser | null> {
    return this.findByIdWithPreferences(id);
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      timezone: string;
      language: string;
      photoR2Key: string | null;
    }>,
  ): Promise<void> {
    if (!userId) {
      throw new Error('updateProfile called without userId');
    }

    const partialUpdate: QueryDeepPartialEntity<EUser> = data;

    await this.userRepository.update({ id: userId }, partialUpdate);
  }

  async save(user: EUser): Promise<EUser> {
    return this.userRepository.save(user);
  }

  async create(data: Partial<EUser>): Promise<EUser> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async softDelete(userId: string): Promise<void> {
    await this.userRepository.softDelete({ id: userId });
  }
}

// Re-export UserRepository for test files
export { UserRepository } from '../../domain/repositories/user-user.repository';
