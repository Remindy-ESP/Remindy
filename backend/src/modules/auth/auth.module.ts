import { APP_GUARD } from '@nestjs/core';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserAuthTypeOrmRepository } from './infrastructure/database/repositories/user-auth-typeorm.repository';
import { IUserAuthRepository } from './domain/repositories/user-auth.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { UserSessionEntity } from 'src/infrastructure/database/entities/user-session.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { UserOrmMapper } from './infrastructure/mappers/user-orm.mapper';
import { BcryptPasswordService } from './infrastructure/services/bcrypt-password.service';
import { IPasswordService } from './domain/services/password.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { ITokenService } from './domain/services/token.service';
import { UserSessionTypeOrmRepository } from './infrastructure/database/repositories/user-session-typeorm.repository';
import { IUserSessionRepository } from './domain/repositories/user-session.repository';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { IEmailService } from './infrastructure/services/email.service';
import { SendgridEmailService } from './infrastructure/services/sendgrid-email.service';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { UsersModule } from '../user/user.module';
import { JwtRefreshGuard } from './presentation/guards/jwt-refresh.guard';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from './presentation/guards/roles.guard';
@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([EUser, UserSessionEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    JwtTokenService,
    JwtRefreshStrategy,
    JwtStrategy,
    JwtRefreshGuard,
    UserOrmMapper,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: ITokenService,
      useClass: JwtTokenService,
    },
    {
      provide: IUserSessionRepository,
      useClass: UserSessionTypeOrmRepository,
    },
    BcryptPasswordService,
    {
      provide: IPasswordService,
      useClass: BcryptPasswordService,
    },
    {
      provide: IUserAuthRepository,
      useClass: UserAuthTypeOrmRepository,
    },
    {
      provide: IEmailService,
      useClass: SendgridEmailService,
    },
  ],
  exports: [JwtTokenService],
})
export class AuthModule {}
