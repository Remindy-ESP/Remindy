import { applyDecorators, Post, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Public } from '../../modules/auth/presentation/decorators/public.decorator';
import { JwtRefreshGuard } from '../../modules/auth/presentation/guards/jwt-refresh.guard';
import { RegisterUserResponseDto } from '../../modules/auth/presentation/dto/register-response.dto';
import { LoginResponseDto } from '../../modules/auth/presentation/dto/login-response.dto';

export const ApiAuthRegister = () =>
  applyDecorators(
    Post('register'),
    Public(),
    ApiOperation({ summary: 'Register a new user account' }),
    ApiCreatedResponse({ type: RegisterUserResponseDto, description: 'Registration successful' }),
    ApiBadRequestResponse({ description: 'Invalid registration data' }),
    ApiConflictResponse({ description: 'Email already in use' }),
  );

export const ApiAuthLogin = () =>
  applyDecorators(
    Post('login'),
    Public(),
    ApiOperation({ summary: 'Login with email and password' }),
    ApiOkResponse({ type: LoginResponseDto, description: 'Login successful' }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials or account locked' }),
    ApiBadRequestResponse({ description: 'Invalid request data' }),
  );

export const ApiAuthRefreshToken = () =>
  applyDecorators(
    Post('refresh-token'),
    Public(),
    UseGuards(JwtRefreshGuard),
    ApiOperation({ summary: 'Refresh access token using a refresh token' }),
    ApiOkResponse({ description: 'Tokens refreshed successfully' }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' }),
  );

export const ApiAuthLogout = () =>
  applyDecorators(
    Post('logout'),
    ApiOperation({ summary: 'Logout and revoke the current refresh token' }),
    ApiOkResponse({ description: 'Logged out successfully' }),
  );

export const ApiAuthForgotPassword = () =>
  applyDecorators(
    Post('forgot-password'),
    Public(),
    ApiOperation({ summary: 'Request a password reset link by email' }),
    ApiOkResponse({ description: 'Reset link sent if the email exists (always returns 200)' }),
  );

export const ApiAuthResetPassword = () =>
  applyDecorators(
    Post('reset-password'),
    Public(),
    ApiOperation({ summary: 'Reset password using a one-time reset token' }),
    ApiOkResponse({ description: 'Password reset successfully' }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' }),
    ApiBadRequestResponse({ description: 'Weak password or missing fields' }),
  );
