import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterUserResponseDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
  @ApiProperty({ description: 'Password' })
  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;

  @ApiProperty({ description: 'First Name' })
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne' })
  firstName?: string;

  @ApiProperty({ description: 'last name' })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne' })
  lastName?: string;

  @ApiProperty({ description: 'phone' })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne' })
  phone?: string;
}