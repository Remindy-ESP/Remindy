import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Abonnements')
@Controller('subscription')
export class SubscriptionController {
  @Post('create')
  create() {
    return { message: 'create OK' };
  }
}
