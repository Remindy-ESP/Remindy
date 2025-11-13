import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserPreferencesRepository } from '../../infrastructure/repositories/user-preferences.repository';
import { UpdateUserProfileDto, UserProfileResponseDto } from '../../presentation/dto/user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findByIdWithPreferences(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photoR2Key: user.photoR2Key,
      role: user.role,
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
      // Basic phone validation (can be enhanced)
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

    // Update user profile
    const updatedUser = await this.userRepository.updateProfile(userId, {
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
      phone: updateDto.phone,
      timezone: updateDto.timezone,
      language: updateDto.language,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      photoR2Key: updatedUser.photoR2Key,
      role: updatedUser.role,
      status: updatedUser.status,
      timezone: updatedUser.timezone,
      language: updatedUser.language,
      emailVerified: updatedUser.emailVerified,
      mfaEnabled: updatedUser.mfaEnabled,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation: should contain only numbers, +, -, spaces, and parentheses
    const phoneRegex = /^[\d\s+\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
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
}
