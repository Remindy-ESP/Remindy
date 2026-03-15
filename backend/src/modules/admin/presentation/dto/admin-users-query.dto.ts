import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity'; 
import { Role } from '../../../auth/domain/value-objects/role.enum';
import { ApiPropertyOptional } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche par prénom, nom ou email',
    example: 'Jean Dupont',
  })
  @IsOptional()
  @IsString()
  q?: string;

  
  @ApiPropertyOptional({
    description: 'Filtrer par rôle',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: UserStatus,
    example: UserStatus.BANNED,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filtrer par vérification d\'email',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mfaEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 25;

  @IsOptional()
  @IsIn(['createdAt', 'lastLoginAt', 'email', 'status'])
  sortBy: 'createdAt' | 'lastLoginAt' | 'email' | 'status' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir: 'ASC' | 'DESC' = 'DESC';
}