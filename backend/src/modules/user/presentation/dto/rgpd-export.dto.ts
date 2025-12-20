import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class CreateRgpdExportDto {
  @ApiPropertyOptional({
    description: "Format du fichier d'export",
    enum: ['json', 'csv'],
    default: 'json',
    example: 'json',
  })
  @IsOptional()
  @IsIn(['json', 'csv'], { message: 'Format must be json or csv' })
  format?: 'json' | 'csv';
}

export class RgpdExportResponseDto {
  @ApiProperty({ example: 'export-123' })
  id: string;

  @ApiProperty({ example: 'user-123' })
  userId: string;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
  })
  status: string;

  @ApiProperty({
    example: 'json',
    enum: ['json', 'csv'],
  })
  format: string;

  @ApiPropertyOptional({ example: 'exports/user-123/export-123.json' })
  fileR2Key?: string;

  @ApiPropertyOptional({ example: 1024000 })
  fileSize?: number;

  @ApiPropertyOptional({ example: 'https://...' })
  signedUrl?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ example: 'Error message if failed' })
  errorMessage?: string;

  @ApiProperty({
    example: 'user',
    enum: ['user', 'admin', 'automated'],
  })
  requestedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}
