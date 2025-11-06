import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { SnoozeNotificationAppDto } from '../dto/snooze-notification-app.dto';

@Injectable()
export class SnoozeNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string, userId: string, dto: SnoozeNotificationAppDto): Promise<Notification> {
    // Verify notification exists and belongs to user
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Snooze the notification
    notification.snooze(dto.snoozedUntil);

    // Update notification
    const updated = await this.notificationRepository.update(id, notification);

    if (!updated) {
      throw new NotFoundException(`Failed to snooze notification with ID ${id}`);
    }

    return updated;
  }
}
