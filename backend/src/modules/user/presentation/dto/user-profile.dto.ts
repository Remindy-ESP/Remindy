import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsPhoneNumber,
  IsIn,
} from 'class-validator';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Photo R2 key' })
  photoR2Key?: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'User status', enum: ['active', 'verified', 'banned', 'inactive'] })
  status: string;

  @ApiProperty({ description: 'Timezone', default: 'Europe/Paris' })
  timezone: string;

  @ApiProperty({ description: 'Language', default: 'fr' })
  language: string;

  @ApiProperty({ description: 'Email verified' })
  emailVerified: boolean;

  @ApiProperty({ description: 'MFA enabled' })
  mfaEnabled: boolean;

  @ApiPropertyOptional({ description: 'Last login date' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt: Date;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'First name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Timezone', default: 'Europe/Paris' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Language (fr, en, es, etc.)', default: 'fr' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
