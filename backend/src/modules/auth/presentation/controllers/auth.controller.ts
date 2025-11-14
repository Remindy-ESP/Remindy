import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegisterRequestDto } from '../dto/register-request.dto';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';  

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterRequestDto) {
    const user = await this.registerUserUseCase.execute(dto);
    return { success: true, userId: user.getId() };
  }

  @Post('login')
  async login(@Body() dto: LoginRequestDto) {
    const result = await this.loginUseCase.execute(dto);
    return result;
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
