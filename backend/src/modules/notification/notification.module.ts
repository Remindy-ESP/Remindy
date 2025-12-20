import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './infrastructure/persistence/notification.entity';
import { NotificationController } from './presentation/controllers/notification.controller';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from './application/ports/notification-repository.interface';
import { FindAllNotificationsUseCase } from './application/use-cases/find-all-notifications.use-case';
import { SnoozeNotificationUseCase } from './application/use-cases/snooze-notification.use-case';
import { MarkNotificationAsReadUseCase } from './application/use-cases/mark-notification-as-read.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), forwardRef(() => AuthModule)],
  controllers: [NotificationController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    FindAllNotificationsUseCase,
    SnoozeNotificationUseCase,
    MarkNotificationAsReadUseCase,
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationModule {}
