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

    const normalizeNullableText = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }

      return value.trim() === '' ? null : value;
    };

    const normalizeRequiredText = (value?: string): string | undefined => {
      if (value === undefined) {
        return undefined;
      }

      return value.trim() === '' ? undefined : value;
    };

    await this.userRepo.updateProfile(userId, {
      firstName: normalizeNullableText(dto.firstName),
      lastName: normalizeNullableText(dto.lastName),
      phone: normalizeNullableText(dto.phone),
      language: normalizeRequiredText(dto.language),
      timezone: normalizeRequiredText(dto.timezone),
      photoR2Key: normalizeNullableText(dto.photoR2Key),
    });
  }
}
