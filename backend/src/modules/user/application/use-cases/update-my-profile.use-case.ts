import { Injectable } from '@nestjs/common';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';
import { UpdateUserMeRequestDto } from '../dto/update-user-profile.request.dto';
@Injectable()
export class UpdateMyProfileUseCase {
  constructor(private readonly userRepo: UserTypeOrmRepository) {}
  async execute(userId: string, dto: UpdateUserMeRequestDto) {
    if (!userId) {
      throw new Error('UpdateMyProfileUseCase called without userId');
    }

    await this.userRepo.updateProfile(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      language: dto.language,
      timezone: dto.timezone,
      photoR2Key: dto.photoR2Key,
    });
  }
}
