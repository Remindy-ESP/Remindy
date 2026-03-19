import { IsEnum, IsIP, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockReason } from 'src/infrastructure/database/entities/blocked-ip.entity';

export class BlockIpDto {
  @ApiProperty({ example: '192.168.1.100' })
  @IsIP()
  ipAddress!: string;

  @ApiProperty({ enum: BlockReason })
  @IsEnum(BlockReason)
  reason!: BlockReason;

  @ApiPropertyOptional({ example: 'Tentatives répétées de connexion' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 60, description: 'Durée en minutes. Omis = permanent.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(525_600)
  durationMinutes?: number;
}
