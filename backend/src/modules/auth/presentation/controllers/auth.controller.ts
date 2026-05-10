import { Controller, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
import {
  ApiAuthRegister,
  ApiAuthLogin,
  ApiAuthRefreshToken,
  ApiAuthLogout,
  ApiAuthForgotPassword,
  ApiAuthResetPassword,
} from '../../../../swagger/decorators/api-auth.decorator';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  /* istanbul ignore next */
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Public()
  @Post('register')
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    type: RegisterUserResponseDto,
  })
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data',
  })
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use',
  })
  /* istanbul ignore next */
  async register(
    @Req() req: Request,
    @Body() dto: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.registerUserUseCase.execute(dto);

    const { accessToken, refreshToken } = await this.loginUseCase.execute({
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

    return {
      success: true,
      userId: user.getId(),
      accessToken,
      refreshToken,
    };
  }

  @Public()
  @Post('login')
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connexion réussie',
    type: LoginResponseDto,
  })
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Email ou mot de passe incorrect',
  })
  /* istanbul ignore next */
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
  })
  /* istanbul ignore next */
  async login(
    @Req() req: Request,
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      deviceName: 'web',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
  }

  @Public()
  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const refreshToken = (req.cookies?.refreshToken as string | undefined) || body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.refreshTokenUseCase.execute({
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  @ApiAuthLogout()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const cookieToken = req.cookies?.refreshToken;
    const refreshToken =
      (typeof cookieToken === 'string' ? cookieToken : undefined) ??
      (typeof body?.refreshToken === 'string' ? body.refreshToken : undefined);
    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/' });
    return { success: true };
  }

  @Public()
  @Post('forgot-password')
  /* istanbul ignore next */
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    await this.forgotPasswordUseCase.execute(dto.email);
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  /* istanbul ignore next */
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });

  @ApiAuthResetPassword()
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    await this.resetPasswordUseCase.execute({ token: dto.token, newPassword: dto.newPassword });
    return { success: true, message: 'Password successfully reset' };
  }
}
