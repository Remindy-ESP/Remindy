import { IsString, MinLength } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
