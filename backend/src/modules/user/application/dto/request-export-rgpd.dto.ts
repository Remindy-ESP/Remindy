import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class RequestRgpdExportDto {
  @ApiPropertyOptional({
    enum: ['json', 'csv'],
    default: 'json',
  })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv';
}