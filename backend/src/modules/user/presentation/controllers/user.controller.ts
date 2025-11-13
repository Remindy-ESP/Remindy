import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserService } from '../../application/services/user.service';
import { UserPreferencesService } from '../../application/services/user-preferences.service';
import { RgpdExportService } from '../../application/services/rgpd-export.service';
import {
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from '../dto/user-profile.dto';
import {
  UpdateUserPreferencesDto,
  UserPreferencesResponseDto,
} from '../dto/user-preferences.dto';
import {
  CreateRgpdExportDto,
  RgpdExportResponseDto,
} from '../dto/rgpd-export.dto';

// TODO: Import your JWT authentication guard
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
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
  async getPreferences(
    @Req() req: Request,
  ): Promise<UserPreferencesResponseDto> {
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
    return this.userPreferencesService.updateUserPreferences(userId, updateDto);
  }

  @Post('export-data')
  @HttpCode(HttpStatus.ACCEPTED)
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
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
    // TODO: Extract user ID from JWT token
    // const userId = req.user.id;
    const userId = 'temp-user-id'; // Temporary placeholder
    return this.rgpdExportService.getExportStatus(userId, exportId);
  }
}
