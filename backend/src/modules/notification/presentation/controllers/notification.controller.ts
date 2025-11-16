import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationFilterDto } from '../dto/notification-filter.dto';
import { SnoozeNotificationDto } from '../dto/snooze-notification.dto';
import { FindAllNotificationsUseCase } from '../../application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from '../../application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { NotificationPresentationMapper } from '../mappers/notification-presentation.mapper';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(ThrottlerGuard)
export class NotificationController {
  constructor(
    private readonly findAllNotificationsUseCase: FindAllNotificationsUseCase,
    private readonly snoozeNotificationUseCase: SnoozeNotificationUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les notifications avec filtres optionnels' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de notification' })
  @ApiQuery({ name: 'channel', required: false, description: 'Filtrer par canal' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'is_read', required: false, description: 'Filtrer par état de lecture' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    type: Number,
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Tri (created_at:asc|desc)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des notifications',
    type: [NotificationResponseDto],
  })
  async findAll(@Query() filters: NotificationFilterDto): Promise<NotificationResponseDto[]> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const appFilters = NotificationPresentationMapper.toFilterAppDto(userId, filters);
    const notifications = await this.findAllNotificationsUseCase.execute(appFilters);
    return NotificationPresentationMapper.toResponseDtoArray(notifications);
  }

  @Put(':id/snooze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reporter une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification reportée avec succès',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  @ApiResponse({ status: 400, description: 'Date invalide (doit être dans le futur)' })
  async snooze(
    @Param('id') id: string,
    @Body() snoozeDto: SnoozeNotificationDto,
  ): Promise<NotificationResponseDto> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const appDto = NotificationPresentationMapper.toSnoozeAppDto(snoozeDto);
    const notification = await this.snoozeNotificationUseCase.execute(id, userId, appDto);
    return NotificationPresentationMapper.toResponseDto(notification);
  }

  @Put(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme lue',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  @ApiResponse({ status: 400, description: 'Notification déjà lue' })
  async markAsRead(@Param('id') id: string): Promise<NotificationResponseDto> {
    // TODO: Get userId from authenticated user (for now, using a placeholder)
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const notification = await this.markNotificationAsReadUseCase.execute(id, userId);
    return NotificationPresentationMapper.toResponseDto(notification);
  }
}
