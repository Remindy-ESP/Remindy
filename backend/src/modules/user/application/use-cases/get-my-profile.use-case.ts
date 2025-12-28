import { Injectable } from '@nestjs/common';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository ';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

@Injectable()
export class GetMyProfileUseCase {
  constructor(private readonly userRepo: UserTypeOrmRepository) {}

  async execute(params: { userId: string }): Promise<EUser> {
    const user = await this.userRepo.findByIdWithPreferences(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user as EUser;
  }
}
