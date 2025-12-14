import { Injectable } from '@nestjs/common';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';

@Injectable()
export class GetMyProfileUseCase {
  constructor(private readonly userRepo: UserTypeOrmRepository) {}

  async execute(params: { userId: string }) {
    const user = await this.userRepo.findByIdWithPreferences(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
