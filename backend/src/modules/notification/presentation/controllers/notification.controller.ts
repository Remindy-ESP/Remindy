import {
  Controller,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Post,
  Put,
  Delete,
  HttpCode,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';
import { RegisterPushTokenDto } from '../dto/register-push-token.dto';
import { FindAllNotificationsUseCase } from '../../application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../../application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { ExpoPushService } from '../../application/services/expo-push.service';
import type { INotificationRepository } from '../../application/ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../application/ports/notification-repository.interface';
import { NotificationPresentationMapper } from '../mappers/notification-presentation.mapper';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import {
  ApiNotificationFindAll,
  ApiNotificationSnooze,
  ApiNotificationMarkRead,
} from '../../../../swagger/decorators/api-notification.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationController {
  constructor(
    private readonly findAllNotificationsUseCase: FindAllNotificationsUseCase,
    private readonly snoozeNotificationUseCase: SnoozeNotificationUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly expoPushService: ExpoPushService,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  private getUserId(req: Request): string {
    return (req as Request & { user: { userId: string } }).user.userId;
  }

  @ApiNotificationFindAll()
  async findAll(
    @Req() req: Request,
    @Query() filters: NotificationFilterDto,
  ): Promise<NotificationResponseDto[]> {
    const userId = this.getUserId(req);
    const appFilters = NotificationPresentationMapper.toFilterAppDto(userId, filters);
    const notifications = await this.findAllNotificationsUseCase.execute(appFilters);
    return NotificationPresentationMapper.toResponseDtoArray(notifications);
  }

  @ApiNotificationSnooze()
  async snooze(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() snoozeDto: SnoozeNotificationDto,
  ): Promise<NotificationResponseDto> {
    const userId = this.getUserId(req);
    const appDto = NotificationPresentationMapper.toSnoozeAppDto(snoozeDto);
    const notification = await this.snoozeNotificationUseCase.execute(id, userId, appDto);
    return NotificationPresentationMapper.toResponseDto(notification);
  }

  @ApiNotificationMarkRead()
  async markAsRead(@Req() req: Request, @Param('id') id: string): Promise<NotificationResponseDto> {
    const notification = await this.markNotificationAsReadUseCase.execute(id, this.getUserId(req));
    return NotificationPresentationMapper.toResponseDto(notification);
  }

  @Put('mark-all-read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @SwaggerResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: Request): Promise<{ message: string; count: number }> {
    const count = await this.notificationRepository.markAllAsRead(this.getUserId(req));
    return { message: 'All notifications marked as read', count };
  }

  @Post('push-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register Expo push notification token' })
  @SwaggerResponse({ status: 200, description: 'Token registered successfully' })
  async registerPushToken(
    @Req() req: Request,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<{ message: string }> {
    await this.expoPushService.registerToken(this.getUserId(req), dto.token);
    return { message: 'Push token registered successfully' };
  }

  @Delete('delete-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete all notifications for the user (soft delete)' })
  @SwaggerResponse({ status: 200, description: 'All notifications deleted successfully' })
  async deleteAllNotifications(@Req() req: Request): Promise<{ message: string }> {
    await this.notificationRepository.deleteAll(this.getUserId(req));
    return { message: 'All notifications deleted successfully' };
  }

  @Delete('push-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unregister Expo push notification token' })
  @SwaggerResponse({ status: 200, description: 'Token unregistered successfully' })
  async unregisterPushToken(@Req() req: Request): Promise<{ message: string }> {
    await this.expoPushService.unregisterToken(this.getUserId(req));
    return { message: 'Push token unregistered successfully' };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a notification (soft delete)' })
  @SwaggerResponse({ status: 200, description: 'Notification deleted successfully' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const userId = this.getUserId(req);
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    await this.notificationRepository.delete(id);
    return { message: 'Notification deleted successfully' };
  }
}
