import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RegenerateEventsTask } from './tasks/regenerate-events.task';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuditModule } from '../audit/audit.module';
import { AuditPurgeTask } from './tasks/audit-purge.task';

@Module({
  imports: [ScheduleModule.forRoot(), SubscriptionModule, AuditModule],
  providers: [RegenerateEventsTask, AuditPurgeTask],
})
export class SchedulerModule {}
