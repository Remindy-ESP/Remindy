import {
  BadRequestException,
  Controller,
  Body,
  Req,
  UnauthorizedException,
  UseGuards,
  Res,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { UserService } from '../../domain/services/user.service';
import { UserPreferencesService } from '../../domain/services/user-preferences.service';
import { UpdateUserProfileDto, UserProfileResponseDto } from '../dto/user-profile.dto';
import { UpdateUserMeRequestDto } from '../../application/dto/update-user-profile.request.dto';
import { UpdateUserPreferencesDto, UserPreferencesResponseDto } from '../dto/user-preferences.dto';
import { RgpdExportResponseDto } from '../dto/rgpd-export.dto';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { GetMyPreferencesUseCase } from '../../application/use-cases/get-my-preferences.use-case';
import { UserMeResponseDto } from '../dto/user-me.response.dto';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import type { RequestWithUser } from 'src/types/request-with-user.interface';
import { UserPreferencesMapper } from '../mappers/user-preferences.mapper';
import { RequestRgpdExportDto } from '../../application/dto/request-export-rgpd.dto';
import { RequestRgpdExportUseCase } from '../../application/use-cases/request-rgpd-export.use-case';
import { Roles } from 'src/modules/auth/presentation/decorators/roles.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { RgpdExportService } from '../../../user/application/services/rgpd-export.service';
import { UserPresenter } from '../mappers/user.presenter';
import { CloudflareR2Service } from 'src/modules/document/infrastructure/services/cloudflare-r2.service';
import {
  ApiUserGetProfile,
  ApiUserGetMe,
  ApiUserUpdateMe,
  ApiUserUploadPhoto,
  ApiUserDeletePhoto,
  ApiUserDeleteAccount,
  ApiUserUpdateProfile,
  ApiUserGetPreferences,
  ApiUserUpdatePreferences,
  ApiUserExportData,
} from '../../../../swagger/decorators/api-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly getMyPreferencesUseCase: GetMyPreferencesUseCase,
    private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase,
    private readonly requestRgpdExportUseCase: RequestRgpdExportUseCase,
    private readonly rgpdExportService: RgpdExportService,
    private readonly r2Service: CloudflareR2Service,
  ) {}

  @ApiUserGetProfile()
  async getProfile(@Req() req: Request): Promise<UserProfileResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.userService.getUserProfile(userId);
  }

  @ApiUserGetMe()
  async getMe(@Req() req: Request): Promise<UserMeResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;
    const profile = await this.getMyProfileUseCase.execute({ userId });
    return this.toUserMeResponse(profile);
  }

  @ApiUserUpdateMe()
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserMeRequestDto) {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;
    await this.updateMyProfileUseCase.execute(userId, dto);
    const updatedProfile = await this.getMyProfileUseCase.execute({ userId });
    return this.toUserMeResponse(updatedProfile);
  }

  @ApiUserUploadPhoto()
  async uploadMyPhoto(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserMeResponseDto> {
    const userId = this.extractUserIdFromRequest(req);

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size <= 0) {
      throw new BadRequestException('File is empty');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Profile photo size exceeds 5MB limit');
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported image type. Allowed: JPEG, PNG, WEBP');
    }

    const existingProfile = await this.getMyProfileUseCase.execute({ userId });
    const previousPhotoKey = existingProfile.photoR2Key ?? null;
    const sanitizedName = this.sanitizeFilename(file.originalname || 'profile-photo');
    const extension = this.resolveImageExtension(file.mimetype);
    const r2Key = `users/${userId}/profile-photo/${Date.now()}-${sanitizedName}${extension}`;

    try {
      await this.r2Service.uploadFile(file.buffer, r2Key, file.mimetype);
      await this.updateMyProfileUseCase.execute(userId, { photoR2Key: r2Key });
      const updatedProfile = await this.getMyProfileUseCase.execute({ userId });

      if (previousPhotoKey && previousPhotoKey !== r2Key) {
        await this.deletePhotoSafely(previousPhotoKey);
      }

      return this.toUserMeResponse(updatedProfile);
    } catch (error) {
      await this.deletePhotoSafely(r2Key);
      throw error;
    }
  }

  @ApiUserDeletePhoto()
  async deleteMyPhoto(@Req() req: Request): Promise<UserMeResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    const existingProfile = await this.getMyProfileUseCase.execute({ userId });
    const previousPhotoKey = existingProfile.photoR2Key ?? null;

    await this.updateMyProfileUseCase.execute(userId, { photoR2Key: '' });

    if (previousPhotoKey) {
      await this.deletePhotoSafely(previousPhotoKey);
    }

    const updatedProfile = await this.getMyProfileUseCase.execute({ userId });
    return this.toUserMeResponse(updatedProfile);
  }

  @ApiUserDeleteAccount()
  async deleteMe(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userId = req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }

    await this.userService.deleteAccount(userId);

    res.clearCookie('refreshToken', {
      path: '/',
    });
  }

  @ApiUserUpdateProfile()
  async updateProfile(
    @Req() req: Request,
    @Body() updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.userService.updateUserProfile(userId, updateDto);
  }

  @ApiUserGetPreferences()
  async getPreferences(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const prefs = await this.getMyPreferencesUseCase.execute(userId);
    return UserPreferencesResponseDto.fromEntity(prefs);
  }

  @ApiUserUpdatePreferences()
  async updatePreferences(@Req() req: RequestWithUser, @Body() dto: UpdateUserPreferencesDto) {
    const userId = req.user.userId;
    const input = UserPreferencesMapper.toInput(dto);
    const updated = await this.updateUserPreferencesUseCase.execute(userId, input);
    return UserPreferencesResponseDto.fromEntity(updated);
  }

  @ApiUserExportData()
  @Roles(Role.USER_FREEMIUM, Role.USER_PREMIUM, Role.USER_ADMIN, Role.SUPER_ADMIN)
  async exportData(
    @Req() req: RequestWithUser,
    @Body() dto: RequestRgpdExportDto,
  ): Promise<RgpdExportResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    return await this.rgpdExportService.createExportRequest(
      req.user.userId,
      { format: dto.format },
      ipAddress,
    );
  }

  private extractUserIdFromRequest(req: Request): string {
    const { user } = req as Request & { user: { userId: string; role: string } };

    if (!user?.userId) {
      throw new UnauthorizedException('Invalid or missing JWT token');
    }

    return user.userId;
  }

  private async toUserMeResponse(
    user: Parameters<typeof UserPresenter.toMe>[0],
  ): Promise<UserMeResponseDto> {
    const response = UserPresenter.toMe(user);

    if (!user.photoR2Key) {
      return response;
    }

    try {
      response.photoUrl = await this.r2Service.getSignedUrl(user.photoR2Key, 86400);
    } catch (error) {
      console.error(`Failed to generate signed URL for profile photo ${user.photoR2Key}:`, error);
    }

    return response;
  }

  private sanitizeFilename(filename: string): string {
    const base = filename.replace(/\.[^/.]+$/, '');
    const sanitized = base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return sanitized || 'profile-photo';
  }

  private resolveImageExtension(mimeType: string): string {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg';

    return '.jpg';
  }

  private async deletePhotoSafely(photoKey: string): Promise<void> {
    try {
      await this.r2Service.deleteFile(photoKey);
    } catch (error) {
      console.error(`Failed to delete profile photo ${photoKey}:`, error);
    }
  }
}
