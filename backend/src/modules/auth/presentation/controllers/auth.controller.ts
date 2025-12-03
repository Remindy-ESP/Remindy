import { Controller, Post, Body, Req, Res, UnauthorizedException, HttpStatus} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { RegisterRequestDto } from '../../application/dto/register-request.dto';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginRequestDto } from '../../application/dto/login-request.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ForgotPasswordRequestDto } from '../../application/dto/forgot-password-request.dto';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordRequestDto } from '../../application/dto/reset-password-request.dto';
import { RegisterUserResponseDto } from '../dto/register-response.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('register')
@ApiResponse({
  status: HttpStatus.CREATED,
  description: 'Registration successful',
  type: RegisterUserResponseDto,
})
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Invalid data',
})
@ApiResponse({
  status: HttpStatus.CONFLICT,
  description: 'Email already in use',
})
  async register(@Body() dto: RegisterRequestDto,) {
    const user = await this.registerUserUseCase.execute(dto);
    return { success: true, userId: user.getId() };
  }

@Post('login')
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Connexion réussie',
  type: LoginResponseDto,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Email ou mot de passe incorrect',
})
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Données invalides',
})
async login(
  @Req() req: Request,
  @Body() dto: LoginRequestDto,
  @Res({ passthrough: true }) res: Response,
) {
  const { accessToken, refreshToken } =
    await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      deviceName: 'web',
    });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return { accessToken };
}

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshTokenUseCase.execute({
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await this.logoutUseCase.execute(refreshToken);
  }

  res.clearCookie('refreshToken', {
    path: '/',
  });

  return { success: true };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    await this.forgotPasswordUseCase.execute(dto.email);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
    };
  }
  @Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordRequestDto) {
  await this.resetPasswordUseCase.execute({
    token: dto.token,
    newPassword: dto.newPassword,
  });

  return {
    success: true,
    message: 'Password successfully reset',
  };
}

}