import { Controller, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';
import { FindAllNotificationsUseCase } from '../../application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../../application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
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
  ) {}

  @ApiNotificationFindAll()
  async findAll(
    @Req() req: Request,
    @Query() filters: NotificationFilterDto,
  ): Promise<NotificationResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

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
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appDto = NotificationPresentationMapper.toSnoozeAppDto(snoozeDto);
    const notification = await this.snoozeNotificationUseCase.execute(id, userId, appDto);
    return NotificationPresentationMapper.toResponseDto(notification);
  }

  @ApiNotificationMarkRead()
  async markAsRead(@Req() req: Request, @Param('id') id: string): Promise<NotificationResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const notification = await this.markNotificationAsReadUseCase.execute(id, userId);
    return NotificationPresentationMapper.toResponseDto(notification);
  }
}
