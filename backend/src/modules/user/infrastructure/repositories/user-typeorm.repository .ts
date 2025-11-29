import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-user.repository';

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
  ) {}

  async findById(id: string): Promise<EUser | null> {
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

  async findByIdWithPreferences(id: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['preferences'],
    });
  }

  async updateProfile(
  userId: string,
  data: Partial<EUser>,
): Promise<void> {
  if (!userId) {
    throw new Error('updateProfile called without userId');
  }

  await this.userRepository.update(
    { id: userId },
    data,
  );
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
