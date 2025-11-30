// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { IsIn, IsOptional } from 'class-validator';

// export class CreateRgpdExportDto {
//   @ApiPropertyOptional({
//     description: 'Export format',
//     enum: ['json', 'csv'],
//     default: 'json',
//   })
//   @IsOptional()
//   @IsIn(['json', 'csv'], { message: 'Format must be json or csv' })
//   format?: string;
// }

// export class RgpdExportResponseDto {
//   @ApiProperty({ description: 'Export ID' })
//   id: string;

//   @ApiProperty({ description: 'User ID' })
//   userId: string;

//   @ApiProperty({
//     description: 'Export status',
//     enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
//   })
//   status: string;

//   @ApiProperty({ description: 'Export format', enum: ['json', 'csv'] })
//   format: string;

//   @ApiPropertyOptional({ description: 'File R2 key' })
//   fileR2Key?: string;

//   @ApiPropertyOptional({ description: 'File size in bytes' })
//   fileSize?: number;

//   @ApiPropertyOptional({ description: 'Signed URL for download' })
//   signedUrl?: string;

//   @ApiPropertyOptional({ description: 'URL expiration date' })
//   expiresAt?: Date;

//   @ApiPropertyOptional({ description: 'Error message if failed' })
//   errorMessage?: string;

//   @ApiProperty({ description: 'Who requested the export', enum: ['user', 'admin', 'automated'] })
//   requestedBy: string;

//   @ApiProperty({ description: 'Request date' })
//   createdAt: Date;

//   @ApiPropertyOptional({ description: 'Completion date' })
//   completedAt?: Date;
// }
import { ApiProperty } from '@nestjs/swagger';

export class RgpdExportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'json' })
  format: string;

  @ApiProperty()
  createdAt: Date;
}
