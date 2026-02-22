import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Req,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getProfile(@Req() req: Request): Promise<UserProfileResponseDto> {
    const userId = this.extractUserIdFromRequest(req);
    return this.userService.getUserProfile(userId);
  }
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile (mobile contract)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile retrieved successfully',
    type: UserMeResponseDto,
  })
  async getMe(@Req() req: Request): Promise<UserMeResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const userId = user.userId;

    const profile = await this.getMyProfileUseCase.execute({ userId });

    return UserPresenter.toMe(profile);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserMeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserMeRequestDto) {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const userId = user.userId;

    await this.updateMyProfileUseCase.execute(userId, dto);

    const updatedProfile = await this.getMyProfileUseCase.execute({ userId });

    return UserPresenter.toMe(updatedProfile);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 1, ttl: 86400000 } }) // 1 request per day
  @ApiOperation({ summary: 'Delete current user account (RGPD right to deletion)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User account deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
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

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async updateProfile(
    @Req() req: Request,
    @Body() updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    return this.userService.updateUserProfile(userId, updateDto);
  }

  @Get('preferences')
  async getPreferences(@Req() req: RequestWithUser) {
    const userId = req.user.userId;

    const prefs = await this.getMyPreferencesUseCase.execute(userId);

    return UserPreferencesResponseDto.fromEntity(prefs);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiBody({ type: UpdateUserPreferencesDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User preferences updated successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async updatePreferences(@Req() req: RequestWithUser, @Body() dto: UpdateUserPreferencesDto) {
    const userId = req.user.userId;

    const input = UserPreferencesMapper.toInput(dto);

    const updated = await this.updateUserPreferencesUseCase.execute(userId, input);

    return UserPreferencesResponseDto.fromEntity(updated);
  }
  @Post('export-data')
  @Roles(Role.USER_PREMIUM)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  /**
   * Helper method to extract user ID from request
   * TODO: Replace with JWT token extraction once guard is implemented
   * @param req Express Request object
   * @returns User ID from token or throws error
   */
  private extractUserIdFromRequest(req: Request): string {
    const { user } = req as Request & { user: { userId: string; role: string } };

    if (!user?.userId) {
      throw new UnauthorizedException('Invalid or missing JWT token');
    }

    return user.userId;
  }
}
