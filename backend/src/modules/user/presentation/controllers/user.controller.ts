import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Utilisateur')
@Controller('user')
export class UserController {

  @Post('ViewProfile')
  ViewProfile() {
    return { message: 'ViewProfile OK' };
  }
}