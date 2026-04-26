import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserResponseDto {
  @ApiProperty({ description: 'Whether registration succeeded' })
  success: boolean;

  @ApiProperty({ description: 'ID of the newly created user' })
  userId: string;

  @ApiProperty({ description: 'JWT access token (auto-login after register)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (also set as httpOnly cookie)' })
  refreshToken: string;
}
