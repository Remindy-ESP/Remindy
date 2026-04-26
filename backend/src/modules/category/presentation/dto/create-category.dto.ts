import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Work',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Icon identifier for the category',
    example: 'briefcase',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  icon: string;

  @ApiProperty({
    description: 'Color HEX code for the category',
    example: '#3B82F6',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid HEX color code (e.g., #3B82F6)',
  })
  color: string;

  @ApiProperty({
    description: 'User ID (optional, will be set from JWT token)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
