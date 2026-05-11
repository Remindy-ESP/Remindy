import {
  applyDecorators,
  Get,
  Put,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../modules/auth/presentation/guards/jwt-auth.guard';
import { UserProfileResponseDto } from '../../modules/user/presentation/dto/user-profile.dto';
import { UserMeResponseDto } from '../../modules/user/presentation/dto/user-me.response.dto';
import { UserPreferencesResponseDto } from '../../modules/user/presentation/dto/user-preferences.dto';

export const ApiUserGetProfile = () =>
  applyDecorators(
    Get('profile'),
    UseGuards(JwtAuthGuard),
    ApiOperation({ summary: 'Get current user profile' }),
    ApiOkResponse({ type: UserProfileResponseDto, description: 'User profile' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUserGetMe = () =>
  applyDecorators(
    Get('me'),
    ApiOperation({ summary: 'Get current user profile (mobile contract)' }),
    ApiOkResponse({ type: UserMeResponseDto, description: 'Current user profile' }),
  );

export const ApiUserUpdateMe = () =>
  applyDecorators(
    Put('me'),
    UseGuards(JwtAuthGuard),
    ApiOperation({ summary: 'Update current user profile' }),
    ApiOkResponse({ type: UserMeResponseDto, description: 'Updated user profile' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUserUploadPhoto = () =>
  applyDecorators(
    Post('me/photo'),
    UseInterceptors(FileInterceptor('file')),
    ApiConsumes('multipart/form-data'),
    ApiOperation({ summary: 'Upload or replace current user profile photo' }),
    ApiOkResponse({ type: UserMeResponseDto, description: 'Profile photo updated' }),
    ApiBadRequestResponse({ description: 'Invalid file (max 5 MB, JPEG/PNG/WEBP only)' }),
  );

export const ApiUserDeletePhoto = () =>
  applyDecorators(
    Delete('me/photo'),
    ApiOperation({ summary: 'Remove current user profile photo' }),
    ApiOkResponse({ type: UserMeResponseDto, description: 'Profile photo removed' }),
  );

export const ApiUserDeleteAccount = () =>
  applyDecorators(
    Delete('me'),
    HttpCode(HttpStatus.NO_CONTENT),
    Throttle({ default: { limit: 1, ttl: 86400000 } }),
    ApiOperation({ summary: 'Delete current user account (RGPD right to deletion)' }),
    ApiNoContentResponse({ description: 'Account deleted' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUserUpdateProfile = () =>
  applyDecorators(
    Put('profile'),
    ApiOperation({ summary: 'Update current user profile' }),
    ApiOkResponse({ type: UserProfileResponseDto, description: 'Profile updated' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUserGetPreferences = () =>
  applyDecorators(
    Get('preferences'),
    ApiOperation({ summary: 'Get current user preferences' }),
    ApiOkResponse({ type: UserPreferencesResponseDto, description: 'User preferences' }),
  );

export const ApiUserUpdatePreferences = () =>
  applyDecorators(
    Put('preferences'),
    ApiOperation({ summary: 'Update current user preferences' }),
    ApiOkResponse({ type: UserPreferencesResponseDto, description: 'Preferences updated' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUserExportData = () =>
  applyDecorators(
    Post('export-data'),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Request a RGPD data export' }),
    ApiOkResponse({ description: 'Export request submitted' }),
  );
