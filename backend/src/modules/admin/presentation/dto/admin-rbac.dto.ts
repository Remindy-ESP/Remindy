import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'user_premium_plus', description: 'Clé unique du rôle (slug)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  key!: string;

  @ApiProperty({ example: 'Premium Plus' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional({ example: 'Utilisateur avec accès complet aux fonctionnalités avancées' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Premium Plus V2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class RolePermissionDto {
  @ApiProperty({ example: 'admin.users.read', description: 'Permission à ajouter/supprimer' })
  @IsString()
  permission!: string;
}
