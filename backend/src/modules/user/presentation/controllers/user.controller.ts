import { Controller, Get, Put, Post, Delete, Body, Param, Req, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { UserService } from '../../application/services/user.service';
import { UserPreferencesService } from '../../application/services/user-preferences.service';
import { RgpdExportService } from '../../application/services/rgpd-export.service';
import { UpdateUserProfileDto, UserProfileResponseDto } from '../dto/user-profile.dto';
import { UpdateUserPreferencesDto, UserPreferencesResponseDto } from '../dto/user-preferences.dto';
import { CreateRgpdExportDto, RgpdExportResponseDto } from '../dto/rgpd-export.dto';

// TODO: Import your JWT authentication guard
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(ThrottlerGuard)
// @UseGuards(JwtAuthGuard) // Uncomment when JWT guard is implemented
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly rgpdExportService: RgpdExportService,
  ) {}

  @Get('profile')
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
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User preferences retrieved successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getPreferences(@Req() req: Request): Promise<UserPreferencesResponseDto> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    return this.userPreferencesService.getUserPreferences(userId);
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
  async updatePreferences(
    @Req() req: Request,
    @Body() updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    return this.userPreferencesService.updateUserPreferences(userId, updateDto);
  }

  @Post('export-data')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 1, ttl: 3600000 } }) // 1 requête par heure
  @ApiOperation({ summary: 'Request RGPD data export' })
  @ApiBody({ type: CreateRgpdExportDto })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export request created successfully',
    type: RgpdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or pending export already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async exportData(
    @Req() req: Request,
    @Body() createDto: CreateRgpdExportDto,
  ): Promise<RgpdExportResponseDto> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    const ipAddress = req.ip || 'unknown';
    return this.rgpdExportService.createExportRequest(userId, createDto, ipAddress);
  }

  @Get('exports')
  @ApiOperation({ summary: 'Get all export requests for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export requests retrieved successfully',
    type: [RgpdExportResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getExports(@Req() req: Request): Promise<RgpdExportResponseDto[]> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    return this.rgpdExportService.getUserExports(userId);
  }

  @Get('exports/:exportId')
  @ApiOperation({ summary: 'Get export request status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export request status retrieved successfully',
    type: RgpdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export request not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getExportStatus(
    @Req() req: Request,
    @Param('exportId') exportId: string,
  ): Promise<RgpdExportResponseDto> {
    // TODO: Implement JWT guard and extract user ID from token
    const userId = this.extractUserIdFromRequest(req);
    return this.rgpdExportService.getExportStatus(userId, exportId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 1, ttl: 86400000 } }) // 1 requête par jour
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
