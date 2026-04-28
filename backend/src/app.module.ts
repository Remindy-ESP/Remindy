import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { FolderModule } from './modules/folder/folder.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { CategoryModule } from './modules/category/category.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { SeedModule } from './modules/seed/seed.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupportModule } from './modules/support/support.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    InfrastructureModule,
    AdminModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SubscriptionModule,
    CategoryModule,
    EventModule,
    EventSeriesModule,
    DocumentModule,
    FolderModule,
    StorageModule,
    NotificationModule,
    ReminderModule,
    AuditModule,
    SchedulerModule,
    SeedModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
