import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the category',
    example: 'Work',
  })
  name: string;

  @ApiProperty({
    description: 'Icon identifier for the category',
    example: 'briefcase',
  })
  icon: string;

  @ApiProperty({
    description: 'Color HEX code for the category',
    example: '#3B82F6',
  })
  color: string;

  @ApiProperty({
    description: 'User ID (null for system categories)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'Whether this is a system category',
    example: false,
  })
  isSystem: boolean;

  @ApiProperty({
    description: 'Date when the category was created',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the category was last updated',
    example: '2025-01-15T12:30:00Z',
    type: String,
  })
  updatedAt: Date;
}
