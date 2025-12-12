import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { typeOrmAsyncConfig } from './infrastructure/config/database.config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UsersModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AuditModule } from './modules/audit/audit.module';
import { EventModule } from './modules/event/event.module';
import { EventSeriesModule } from './modules/event-series/event-series.module';
import { DocumentModule } from './modules/document/document.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.develop`,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    InfrastructureModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SubscriptionModule,
    EventModule,
    EventSeriesModule,
    DocumentModule,
    NotificationModule,
    ReminderModule,
    AuditModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
