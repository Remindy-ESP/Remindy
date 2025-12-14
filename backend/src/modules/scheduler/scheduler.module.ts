import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RegenerateEventsTask } from './tasks/regenerate-events.task';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [ScheduleModule.forRoot(), SubscriptionModule],
  providers: [RegenerateEventsTask],
})
export class SchedulerModule {}
