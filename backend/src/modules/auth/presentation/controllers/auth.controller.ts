import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Authentification')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  register() {
    return { message: 'register OK' };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  login() {
    return { message: 'login OK' };
  }

  @Post('logout')
  logout() {
    return { message: 'logout OK' };
  }

  @Post('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  refreshToken() {
    return { message: 'refresh-token OK' };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  forgotPassword() {
    return { message: 'forgot-password OK' };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 requests per 10 minutes
  resetPassword() {
    return { message: 'reset-password OK' };
  }
}
