import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../domain/user-status.enum';
import { User } from '../../domain/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Whether the user email has been verified',
    example: false,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Role assigned to the user',
    example: 'premium',
    nullable: false,
  })
  role: string;

  @ApiProperty({
    description: 'Number of failed login attempts',
    example: 0,
  })
  failedLoginCount: number;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.getId();
    dto.email = user.getEmailValue();
    dto.firstName = user.getFirstName();
    dto.lastName = user.getLastName();
    dto.status = user.getStatus();
    dto.emailVerified = user.isEmailVerified();
    dto.role = user.getRole();
    dto.failedLoginCount = user.getFailedLoginCount();
    dto.createdAt = user.getCreatedAt();
    dto.updatedAt = user.getUpdatedAt();
    return dto;
  }
}
