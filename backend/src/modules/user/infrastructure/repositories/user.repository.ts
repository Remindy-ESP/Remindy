import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
  ) {}

  async findById(id: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['preferences'],
    });
  }

  async findByEmail(email: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByIdWithPreferences(id: string): Promise<EUser | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['preferences'],
    });
  }

  async updateProfile(
    id: string,
    data: Partial<EUser>,
  ): Promise<EUser | null> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async save(user: EUser): Promise<EUser> {
    return this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
