import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository ';
import { UserPreferencesRepository } from '../../infrastructure/repositories/user-preferences.repository';
import {
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from '../../presentation/dto/user-profile.dto';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserTypeOrmRepository,
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findByIdWithPreferences(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToProfileResponseDto(user);
  }

  async updateUserProfile(
    userId: string,
    updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate phone number format if provided
    if (updateDto.phone !== undefined) {
      if (updateDto.phone && !this.isValidPhoneNumber(updateDto.phone)) {
        throw new BadRequestException('Invalid phone number format');
      }
    }

    // Validate timezone if provided
    if (updateDto.timezone !== undefined) {
      if (!this.isValidTimezone(updateDto.timezone)) {
        throw new BadRequestException('Invalid timezone');
      }
    }

    // Build update data, filtering out undefined values
    const updateData: Partial<EUser> = {};

    if (updateDto.firstName !== undefined) {
      updateData.firstName = updateDto.firstName;
    }
    if (updateDto.lastName !== undefined) {
      updateData.lastName = updateDto.lastName;
    }
    if (updateDto.phone !== undefined) {
      updateData.phone = updateDto.phone;
    }
    if (updateDto.timezone !== undefined) {
      updateData.timezone = updateDto.timezone;
    }
    if (updateDto.language !== undefined) {
      updateData.language = updateDto.language;
    }

    await this.userRepository.updateProfile(userId, updateData);

    const updatedUser = await this.userRepository.findById(userId);

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return this.mapToProfileResponseDto(updatedUser);
  }

  private mapToProfileResponseDto(user: EUser): UserProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photoR2Key: user.photoR2Key,
      role_key: user.role_key,
      status: user.status,
      timezone: user.timezone,
      language: user.language,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

private isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-()]+$/;

  return (
    phoneRegex.test(phone) &&
    phone.replaceAll(/\D/g, '').length >= 10
  );
}


  private isValidTimezone(timezone: string): boolean {
    // Common timezone validation
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete user account with cascade soft delete
   * This will soft delete:
   * - User account
   * - User preferences
   * - User sessions (handled by FK cascade)
   * - User subscriptions (handled by FK cascade)
   * - User documents (handled by FK cascade)
   * - User notifications (handled by FK cascade)
   * - User reminders (handled by FK cascade)
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete user preferences first
    await this.userPreferencesRepository.softDelete(userId);

    // Soft delete user account (cascade will handle related entities)
    await this.userRepository.softDelete(userId);
  }
}
