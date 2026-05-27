import {
  Controller,
  Body,
  Req,
  Res,
  UnauthorizedException,
  Post,
  Get,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { OAuthLoginUseCase } from '../../application/use-cases/oauth-login.use-case';
import { GoogleOAuthService } from '../../infrastructure/services/google-oauth.service';
import {
  ApiAuthLogout,
  ApiAuthResetPassword,
} from '../../../../swagger/decorators/api-auth.decorator';
import { Public } from '../decorators/public.decorator';
import { RegisterUserResponseDto } from '../dto/register-response.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';

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
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  @Public()
  @Get('password-reset-redirect')
  passwordResetRedirect(@Query('token') token: string, @Res() res: Response) {
    const deepLink = `remindy://reset-password?token=${encodeURIComponent(token ?? '')}`;
    return res.send(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${deepLink}"></head><body><script>window.location.href="${deepLink}";</script><p><a href="${deepLink}">Réinitialiser mon mot de passe</a></p></body></html>`,
    );
  }

  @Public()
  @Get('oauth/google/mobile')
  googleMobileInit(@Query('returnUrl') returnUrl: string, @Res() res: Response) {
    const callbackUrl = process.env.GOOGLE_MOBILE_CALLBACK_URL ?? '';
    const state = Buffer.from(returnUrl || 'remindy://oauth').toString('base64url');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID ?? '');
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'online');
    res.redirect(authUrl.toString());
  }

  @Public()
  @Get('oauth/google/mobile/callback')
  async googleMobileCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const returnUrl = state ? Buffer.from(state, 'base64url').toString('utf-8') : 'remindy://oauth';

    if (error || !code) {
      return res.redirect(`${returnUrl}?error=${encodeURIComponent(error ?? 'cancelled')}`);
    }

    try {
      const callbackUrl = process.env.GOOGLE_MOBILE_CALLBACK_URL ?? '';
      const idToken = await this.googleOAuthService.exchangeCodeForIdToken(code, callbackUrl);
      const result = await this.oauthLoginUseCase.execute({
        provider: 'google',
        token: idToken,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
      });
      return res.redirect(
        `${returnUrl}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (err) {
      console.error('[OAuth Google callback error]', err);
      return res.redirect(`${returnUrl}?error=auth_failed`);
    }
  }

  @Public()
  @Post('oauth/google')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google OAuth login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid Google token' })
  async oauthGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { idToken: string },
  ) {
    const result = await this.oauthLoginUseCase.execute({
      provider: 'google',
      token: body.idToken,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Public()
  @Post('oauth/microsoft')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Microsoft OAuth login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid Microsoft token' })
  async oauthMicrosoft(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { accessToken: string },
  ) {
    const result = await this.oauthLoginUseCase.execute({
      provider: 'microsoft',
      token: body.accessToken,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Public()
  @Post('oauth/apple')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apple OAuth login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid Apple identity token' })
  async oauthApple(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { identityToken: string; email?: string; firstName?: string; lastName?: string },
  ) {
    const result = await this.oauthLoginUseCase.execute({
      provider: 'apple',
      token: body.identityToken,
      appleEmail: body.email,
      appleFirstName: body.firstName,
      appleLastName: body.lastName,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Public()
  @Post('register')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    type: RegisterUserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use' })
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

    return { success: true, userId: user.getId(), accessToken, refreshToken };
  }

  @Public()
  @Post('login')
  @ApiResponse({ status: HttpStatus.OK, description: 'Connexion réussie', type: LoginResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Email ou mot de passe incorrect' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Données invalides' })
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
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    await this.forgotPasswordUseCase.execute(dto.email);
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiAuthResetPassword()
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    await this.resetPasswordUseCase.execute({ token: dto.token, newPassword: dto.newPassword });
    return { success: true, message: 'Password successfully reset' };
  }

  @Public()
  @Get('verify-email')
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string) {
    await this.verifyEmailUseCase.execute(token);
    return { success: true, message: 'Email successfully verified' };
  }
}
