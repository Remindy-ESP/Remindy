import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSecurityPolicyDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsInt() @Min(1) @Max(20)
  maxLoginAttempts?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional() @IsInt() @Min(1) @Max(1440)
  lockoutDurationMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @IsInt() @Min(5) @Max(1440)
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  requireMfaForAdmin?: boolean;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional() @IsInt() @Min(8) @Max(128)
  minPasswordLength?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  requireUppercase?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  requireNumbers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  requireSpecialChars?: boolean;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @IsInt() @Min(0) @Max(365)
  passwordExpiryDays?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsInt() @Min(10) @Max(10_000)
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsInt() @Min(5) @Max(1000)
  autoBlockAfterRequests?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @IsInt() @Min(1) @Max(1440)
  autoBlockDurationMinutes?: number;

  @ApiPropertyOptional({ example: ['https://app.remindy.fr'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  allowedOrigins?: string[];
}