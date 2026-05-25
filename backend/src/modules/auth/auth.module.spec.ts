import 'reflect-metadata';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserAuthTypeOrmRepository } from './infrastructure/database/repositories/user-auth-typeorm.repository';
import { IUserAuthRepository } from './domain/repositories/user-auth.repository';
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
import { BrevoEmailService } from './infrastructure/services/sendgrid-email.service';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { UsersModule } from '../user/user.module';
import { JwtRefreshGuard } from './presentation/guards/jwt-refresh.guard';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from './presentation/guards/roles.guard';
import { UserMfaTypeOrmRepository } from '../admin/infrastructure/database/repositories/user-mfa-typeorm.repository';
import { TotpService } from '../admin/infrastructure/services/totp.service';
import { CryptoService } from '../admin/infrastructure/services/crypto.service';
import { AdminModule } from '../admin/admin.module';

describe('AuthModule', () => {
  const metadata = Reflect.getMetadata('imports', AuthModule) as any[];
  const controllers = Reflect.getMetadata('controllers', AuthModule) as any[];
  const providers = Reflect.getMetadata('providers', AuthModule) as any[];
  const exportsMetadata = Reflect.getMetadata('exports', AuthModule) as any[];

  it('defines the expected imports and controllers', () => {
    expect(metadata).toHaveLength(4);
    expect(controllers).toEqual([AuthController]);

    expect(metadata[0]).toEqual(
      expect.objectContaining({
        forwardRef: expect.any(Function),
      }),
    );
    expect(metadata[0].forwardRef()).toBe(UsersModule);

    expect(metadata[1]).toEqual(
      expect.objectContaining({
        forwardRef: expect.any(Function),
      }),
    );
    expect(metadata[1].forwardRef()).toBe(AdminModule);

    expect(metadata[2]).toBeDefined();
    expect(metadata[3]).toBeDefined();
  });

  it('defines the expected providers', () => {
    expect(providers).toEqual(
      expect.arrayContaining([
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
        UserMfaTypeOrmRepository,
        TotpService,
        CryptoService,
        BcryptPasswordService,
        expect.objectContaining({
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        }),
        expect.objectContaining({
          provide: APP_GUARD,
          useClass: RolesGuard,
        }),
        expect.objectContaining({
          provide: ITokenService,
          useClass: JwtTokenService,
        }),
        expect.objectContaining({
          provide: IUserSessionRepository,
          useClass: UserSessionTypeOrmRepository,
        }),
        expect.objectContaining({
          provide: IPasswordService,
          useClass: BcryptPasswordService,
        }),
        expect.objectContaining({
          provide: IUserAuthRepository,
          useClass: UserAuthTypeOrmRepository,
        }),
        expect.objectContaining({
          provide: IEmailService,
          useClass: BrevoEmailService,
        }),
      ]),
    );
  });

  it('defines the expected exports', () => {
    expect(exportsMetadata).toEqual([
      JwtTokenService,
      ITokenService,
      UserMfaTypeOrmRepository,
      TotpService,
    ]);
  });

  it('registers TypeOrm and Jwt module imports', () => {
    const typeOrmImport = metadata[2];
    const jwtImport = metadata[3];

    expect(typeOrmImport).toBeDefined();
    expect(jwtImport).toBeDefined();

    expect(TypeOrmModule.forFeature([EUser, UserSessionEntity])).toBeDefined();
    expect(JwtModule.register({})).toBeDefined();
  });
});
