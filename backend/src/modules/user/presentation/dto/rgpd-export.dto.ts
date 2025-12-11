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
