import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class ReprocessOcrDto {
  @ApiPropertyOptional({
    description: 'Forcer le retraitement même si OCR déjà complété',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
