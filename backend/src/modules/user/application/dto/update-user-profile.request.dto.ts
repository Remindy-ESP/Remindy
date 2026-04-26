import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserMeRequestDto {
  @ApiPropertyOptional({
    example: 'Jean',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Dupont',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '+33123456789',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'fr',
    type: String,
    required: false,
    enum: ['fr', 'en', 'es', 'de', 'it', 'pt'],
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: 'Europe/Paris',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'users/123/photos/profile.jpg',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  photoR2Key?: string;
}
