import { IsOptional, IsBoolean } from 'class-validator';

export class AdminReprocessOcrDto {
  @IsOptional() @IsBoolean() force?: boolean = false;
}
