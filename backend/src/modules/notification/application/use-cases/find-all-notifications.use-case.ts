import { Injectable, Inject } from '@nestjs/common';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { NotificationFilterAppDto } from '../dto/notification-filter-app.dto';

@Injectable()
export class FindAllNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(filters: NotificationFilterAppDto): Promise<Notification[]> {
    return await this.notificationRepository.findAll(filters);
  }
}
