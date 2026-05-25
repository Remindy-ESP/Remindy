import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegenerateEventsTask } from './tasks/regenerate-events.task';
import { ProcessRenewalNotificationsTask } from './tasks/process-renewal-notifications.task';
import { SendMonthlyReportTask } from './tasks/send-monthly-report.task';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuditModule } from '../audit/audit.module';
import { ReminderModule } from '../reminder/reminder.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { AuditPurgeTask } from './tasks/audit-purge.task';
import { SubscriptionEntity } from '../subscription/infrastructure/persistence/subscription.entity';
import { ReminderEntity } from '../reminder/infrastructure/persistence/reminder.entity';
import { NotificationEntity } from '../notification/infrastructure/persistence/notification.entity';
import { UserPreferenceEntity } from '../../infrastructure/database/entities/user-preference.entity';
import { EUser } from '../../infrastructure/database/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      ReminderEntity,
      NotificationEntity,
      UserPreferenceEntity,
      EUser,
    ]),
    SubscriptionModule,
    AuditModule,
    ReminderModule,
    NotificationModule,
    AuthModule,
  ],
  providers: [
    RegenerateEventsTask,
    AuditPurgeTask,
    ProcessRenewalNotificationsTask,
    SendMonthlyReportTask,
  ],
})
export class SchedulerModule {}
