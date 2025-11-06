import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INotificationRepository } from '../ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Notification> {
    // Verify notification exists and belongs to user
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Mark as read
    notification.markAsRead();

    // Update notification
    const updated = await this.notificationRepository.update(id, notification);

    if (!updated) {
      throw new NotFoundException(`Failed to mark notification with ID ${id} as read`);
    }

    return updated;
  }
}
