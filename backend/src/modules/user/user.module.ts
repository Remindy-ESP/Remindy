import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EUser } from '../../infrastructure/database/entities/user.entity';
import { UserPreferenceEntity } from '../../infrastructure/database/entities/user-preference.entity';
import { UserSessionEntity } from '../../infrastructure/database/entities/user-session.entity';
import { RgpdExportEntity } from '../../infrastructure/database/entities/rgpd-export.entity';
import { RoleEntity } from '../../infrastructure/database/entities/role.entity';
import { RoleLimitEntity } from 'src/infrastructure/database/entities/role-limit.entity';

// Controller
import { UserController } from './presentation/controllers/user.controller';

// Domain repositories (TOKENS)
import { UserRepository } from './domain/repositories/user-user.repository';
import { AbstractUserSessionRepository } from './domain/repositories/user-session-repository';

// Infrastructure repositories (IMPLEMENTATIONS)
import { UserTypeOrmRepository } from './infrastructure/repositories/user-typeorm.repository';
import { UserPreferencesRepository } from './infrastructure/repositories/user-preferences.repository';
import { UserSessionRepository } from './infrastructure/repositories/user-session.repository';
import { RgpdExportRepository } from './infrastructure/repositories/rgpd-export.repository';

// Services
import { UserService } from './domain/services/user.service';
import { UserPreferencesService } from './domain/services/user-preferences.service';
import { RequestRgpdExportUseCase } from './application/use-cases/request-rgpd-export.use-case';
// Use cases
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { DeleteMyAccountUseCase } from './application/use-cases/delete-my-account.use-case';
import { GetMyPreferencesUseCase } from './application/use-cases/get-my-preferences.use-case';
import { UpdateUserPreferencesUseCase } from './application/use-cases/update-user-preferences.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EUser,
      UserPreferenceEntity,
      UserSessionEntity,
      RgpdExportEntity,
      RoleEntity,
      RoleLimitEntity,
    ]),
    forwardRef(() => AuthModule),
  ],

  controllers: [UserController],

  providers: [
    // USE CASES
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    DeleteMyAccountUseCase,
    GetMyPreferencesUseCase,
    UpdateUserPreferencesUseCase,
    RequestRgpdExportUseCase,

    // SERVICES
    UserService,
    UserPreferencesService,

    // INFRASTRUCTURE REPOS
    UserTypeOrmRepository,
    UserPreferencesRepository,
    UserSessionRepository,
    RgpdExportRepository,

    // DOMAIN → INFRA MAPPINGS
    {
      provide: UserRepository,
      useClass: UserTypeOrmRepository,
    },
    {
      provide: AbstractUserSessionRepository,
      useClass: UserSessionRepository,
    },
  ],

  exports: [
    UserRepository,
    AbstractUserSessionRepository,
    UserService,
    UserPreferencesService,
    UserPreferencesRepository,
  ],
})
export class UsersModule {}
