import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../domain/role.entity';

export class RoleResponseDto {
  @ApiProperty({
    description: 'Role unique key',
    example: 'premium',
  })
  key: string;

  @ApiProperty({
    description: 'Role label',
    example: 'Premium',
  })
  label: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Premium subscription role',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Timestamp when the role was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  static fromDomain(role: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.key = role.getKey();
    dto.label = role.getLabel();
    dto.description = role.getDescription();
    dto.createdAt = role.getCreatedAt();
    return dto;
  }
}
