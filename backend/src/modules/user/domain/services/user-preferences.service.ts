import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserPreferencesRepository } from '../../infrastructure/repositories/user-preferences.repository';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';
import {
  UpdateUserPreferencesDto,
  UserPreferencesResponseDto,
} from '../../presentation/dto/user-preferences.dto';
import { Theme } from 'src/infrastructure/database/entities/user-preference.entity';
import { ISO_CURRENCY_REGEX } from 'src/utils/regex';
@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly userRepository: UserTypeOrmRepository,
  ) {}

  async getUserPreferences(userId: string): Promise<UserPreferencesResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create preferences
    const preferences =
      (await this.userPreferencesRepository.findByUserId(userId)) ??
      (await this.userPreferencesRepository.createDefaultPreferences(userId));

    return {
      userId: preferences.userId,
      theme: preferences.theme,
      notificationEmail: preferences.notificationEmail,
      notificationPush: preferences.notificationPush,
      notificationSms: preferences.notificationSms,
      defaultReminderDelay: preferences.defaultReminderDelay,
      currency: preferences.currency,
      showOnlineStatus: preferences.showOnlineStatus,
      monthlyReportEnabled: preferences.monthlyReportEnabled,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate currency format if provided
    if (updateDto.currency !== undefined) {
      if (updateDto.currency && !this.isValidCurrency(updateDto.currency.toUpperCase())) {
        throw new BadRequestException('Invalid currency code (must be 3 characters)');
      }
    }

    // Validate reminder delay if provided
    if (updateDto.defaultReminderDelay !== undefined) {
      if (updateDto.defaultReminderDelay < 1 || updateDto.defaultReminderDelay > 365) {
        throw new BadRequestException('Default reminder delay must be between 1 and 365 days');
      }
    }

    // Check if preferences exist, create if not
    let preferences = await this.userPreferencesRepository.findByUserId(userId);
    if (!preferences) {
      preferences = await this.userPreferencesRepository.createDefaultPreferences(userId);
    }

    // Update preferences
    const updatedPreferences = await this.userPreferencesRepository.update(userId, {
      theme: updateDto.theme as Theme | undefined,
      notificationEmail: updateDto.notificationEmail,
      notificationPush: updateDto.notificationPush,
      notificationSms: updateDto.notificationSms,
      defaultReminderDelay: updateDto.defaultReminderDelay,
      currency: updateDto.currency?.toUpperCase(),
      showOnlineStatus: updateDto.showOnlineStatus,
      monthlyReportEnabled: updateDto.monthlyReportEnabled,
    });

    if (!updatedPreferences) {
      throw new NotFoundException('Preferences not found after update');
    }

    return {
      userId: updatedPreferences.userId,
      theme: updatedPreferences.theme,
      notificationEmail: updatedPreferences.notificationEmail,
      notificationPush: updatedPreferences.notificationPush,
      notificationSms: updatedPreferences.notificationSms,
      defaultReminderDelay: updatedPreferences.defaultReminderDelay,
      currency: updatedPreferences.currency,
      showOnlineStatus: updatedPreferences.showOnlineStatus,
      monthlyReportEnabled: updatedPreferences.monthlyReportEnabled,
      createdAt: updatedPreferences.createdAt,
      updatedAt: updatedPreferences.updatedAt,
    };
  }

  private isValidCurrency(currency: string): boolean {
    // Check if it's a valid 3-letter ISO currency code
    return ISO_CURRENCY_REGEX.test(currency);
  }
}
