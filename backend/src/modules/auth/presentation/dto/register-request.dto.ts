import { IsEmail, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  firstName?: string;
  lastName?: string;
}