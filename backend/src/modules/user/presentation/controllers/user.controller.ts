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
import { DeleteMyAccountUseCase } from '../../application/use-cases/delete-my-account.use-case';
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
// TODO: Import your JWT authentication guard
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

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
    private readonly deleteMyAccountUseCase: DeleteMyAccountUseCase,
    private readonly getMyPreferencesUseCase: GetMyPreferencesUseCase,
    private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase,
    private readonly requestRgpdExportUseCase: RequestRgpdExportUseCase,
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
    // TODO: Implement JWT guard and extract user ID from token
    // When JWT guard is implemented, use: const userId = req.user.id;
    const userId = this.extractUserIdFromRequest(req);
    return this.userService.getUserProfile(userId);
  }
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return this.getMyProfileUseCase.execute({ userId });
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
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: UpdateUserMeRequestDto,
  ) {
    const userId = req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    await this.updateMyProfileUseCase.execute(userId, dto);

    return { success: true };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(
    @Req() req: Request & { user: { userId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }

    await this.deleteMyAccountUseCase.execute(userId);

    res.clearCookie('refreshToken', {
      path: '/',
    });

    return { success: true };
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
    const result = await this.requestRgpdExportUseCase.execute(req.user.userId, dto);

    return {
      id: result.id,
      status: result.status,
      format: result.format,
      createdAt: result.createdAt,
    };
  }

  // @Post('export-data')
  // @HttpCode(HttpStatus.ACCEPTED)
  // @Throttle({ default: { limit: 1, ttl: 3600000 } }) // 1 requête par heure
  // @ApiOperation({ summary: 'Request RGPD data export' })
  // @ApiBody({ type: CreateRgpdExportDto })
  // @ApiResponse({
  //   status: HttpStatus.ACCEPTED,
  //   description: 'Export request created successfully',
  //   type: RgpdExportResponseDto,
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Invalid input data or pending export already exists',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'User not found',
  // })
  // @ApiResponse({
  //   status: HttpStatus.UNAUTHORIZED,
  //   description: 'Unauthorized',
  // })
  // async exportData(
  //   @Req() req: Request,
  //   @Body() createDto: CreateRgpdExportDto,
  // ): Promise<RgpdExportResponseDto> {
  //   // TODO: Implement JWT guard and extract user ID from token
  //   const userId = this.extractUserIdFromRequest(req);
  //   const ipAddress = req.ip || 'unknown';
  //   return this.rgpdExportService.createExportRequest(userId, createDto, ipAddress);
  // }

  // @Get('exports')
  // @ApiOperation({ summary: 'Get all export requests for current user' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Export requests retrieved successfully',
  //   type: [RgpdExportResponseDto],
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'User not found',
  // })
  // @ApiResponse({
  //   status: HttpStatus.UNAUTHORIZED,
  //   description: 'Unauthorized',
  // })
  // async getExports(@Req() req: Request): Promise<RgpdExportResponseDto[]> {
  //   // TODO: Implement JWT guard and extract user ID from token
  //   const userId = this.extractUserIdFromRequest(req);
  //   return this.rgpdExportService.getUserExports(userId);
  // }

  // @Get('exports/:exportId')
  // @ApiOperation({ summary: 'Get export request status' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Export request status retrieved successfully',
  //   type: RgpdExportResponseDto,
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Export request not found',
  // })
  // @ApiResponse({
  //   status: HttpStatus.UNAUTHORIZED,
  //   description: 'Unauthorized',
  // })
  // async getExportStatus(
  //   @Req() req: Request,
  //   @Param('exportId') exportId: string,
  // ): Promise<RgpdExportResponseDto> {
  //   // TODO: Implement JWT guard and extract user ID from token
  //   const userId = this.extractUserIdFromRequest(req);
  //   return this.rgpdExportService.getExportStatus(userId, exportId);
  // }

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
  async deleteAccount(@Req() req: Request): Promise<void> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    await this.userService.deleteAccount(userId);
  }

  /**
   * Helper method to extract user ID from request
   * TODO: Replace with JWT token extraction once guard is implemented
   * @param req Express Request object
   * @returns User ID from token or throws error
   */
  private extractUserIdFromRequest(_req: Request): string {
    // TODO: Implement actual JWT extraction
    // This is a temporary placeholder that should be replaced with:
    // const user = req.user as JwtPayload;
    // if (!user?.id) throw new UnauthorizedException('Invalid token');
    // return user.id;

    // For now, throw error to indicate JWT is not implemented
    throw new Error(
      'JWT authentication not yet implemented. Please implement JWT guard and token extraction.',
    );
  }
}
