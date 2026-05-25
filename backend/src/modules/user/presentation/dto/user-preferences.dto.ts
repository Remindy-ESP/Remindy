import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsInt, IsOptional, Min, Max, MaxLength, IsIn } from 'class-validator';
import { UserPreferenceEntity } from 'src/infrastructure/database/entities/user-preference.entity';

export class UserPreferencesResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Theme preference', enum: ['light', 'dark', 'auto'] })
  theme: string;

  @ApiProperty({ description: 'Email notifications enabled' })
  notificationEmail: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  notificationPush: boolean;

  @ApiProperty({ description: 'SMS notifications enabled' })
  notificationSms: boolean;

  @ApiProperty({ description: 'Default reminder delay in days' })
  defaultReminderDelay: number;

  @ApiProperty({ description: 'Currency', default: 'EUR' })
  currency: string;

  @ApiProperty({ description: 'Show online status' })
  showOnlineStatus: boolean;

  @ApiProperty({ description: 'Monthly expense report enabled' })
  monthlyReportEnabled: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt: Date;

  static fromEntity(entity: UserPreferenceEntity): UserPreferencesResponseDto {
    return {
      userId: entity.userId,
      theme: entity.theme,
      notificationEmail: entity.notificationEmail,
      notificationPush: entity.notificationPush,
      notificationSms: entity.notificationSms,
      defaultReminderDelay: entity.defaultReminderDelay,
      currency: entity.currency,
      showOnlineStatus: entity.showOnlineStatus,
      monthlyReportEnabled: entity.monthlyReportEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    description: 'Theme preference',
    enum: ['light', 'dark', 'auto'],
    default: 'light',
  })
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'], { message: 'Theme must be light, dark, or auto' })
  theme?: string;

  @ApiPropertyOptional({ description: 'Enable email notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notificationEmail?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notificationPush?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications', default: false })
  @IsOptional()
  @IsBoolean()
  notificationSms?: boolean;

  @ApiPropertyOptional({
    description: 'Default reminder delay in days (1-365)',
    minimum: 1,
    maximum: 365,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  defaultReminderDelay?: number;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217 code)',
    maxLength: 3,
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Show online status', default: true })
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional({ description: 'Enable monthly expense report email', default: true })
  @IsOptional()
  @IsBoolean()
  monthlyReportEnabled?: boolean;
}
