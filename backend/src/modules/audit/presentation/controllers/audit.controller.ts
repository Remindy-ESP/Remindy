import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {

  @Post('create')
  create() {
    return { message: 'create OK' };
  }
}