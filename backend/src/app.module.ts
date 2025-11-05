import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './infrastructure/config/database.config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
<<<<<<< Updated upstream
import { UsersModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AuditModule } from './modules/audit/audit.module';
=======
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { RoleLimitModule } from './modules/role-limit/role-limit.module';
import { UserSessionModule } from './modules/user-session/user-session.module';
import { UserPreferenceModule } from './modules/user-preference/user-preference.module';
>>>>>>> Stashed changes

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.develop`,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    InfrastructureModule,
<<<<<<< Updated upstream
    AuthModule,
    UsersModule,
    SubscriptionModule,
    AuditModule,
=======
    // Domain modules
    UserModule,
    RoleModule,
    RoleLimitModule,
    UserSessionModule,
    UserPreferenceModule,
>>>>>>> Stashed changes
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
