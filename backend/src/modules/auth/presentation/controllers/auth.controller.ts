import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  @Post('register')
  register() {
    return { message: 'register OK' };
  }

  @Post('login')
  login() {
    return { message: 'login OK' };
  }

  @Post('logout')
  logout() {
    return { message: 'logout OK' };
  }

  @Post('refresh-token')
  refreshToken() {
    return { message: 'refresh-token OK' };
  }

  @Post('forgot-password')
  forgotPassword() {
    return { message: 'forgot-password OK' };
  }

  @Post('reset-password')
  resetPassword() {
    return { message: 'reset-password OK' };
  }
}
