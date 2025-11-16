import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EUser } from '../../infrastructure/database/entities/user.entity';
import { UserPreferenceEntity } from '../../infrastructure/database/entities/user-preference.entity';
import { UserSessionEntity } from '../../infrastructure/database/entities/user-session.entity';
import { RgpdExportEntity } from '../../infrastructure/database/entities/rgpd-export.entity';
import { RoleEntity } from '../../infrastructure/database/entities/role.entity';

// Controllers
import { UserController } from './presentation/controllers/user.controller';

// Services
import { UserService } from './application/services/user.service';
import { UserPreferencesService } from './application/services/user-preferences.service';
import { RgpdExportService } from './application/services/rgpd-export.service';

// Repositories
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserPreferencesRepository } from './infrastructure/repositories/user-preferences.repository';
import { UserSessionRepository } from './infrastructure/repositories/user-session.repository';
import { RgpdExportRepository } from './infrastructure/repositories/rgpd-export.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EUser,
      UserPreferenceEntity,
      UserSessionEntity,
      RgpdExportEntity,
      RoleEntity,
    ]),
  ],
  controllers: [UserController],
  providers: [
    // Services
    UserService,
    UserPreferencesService,
    RgpdExportService,
    // Repositories
    UserRepository,
    UserPreferencesRepository,
    UserSessionRepository,
    RgpdExportRepository,
  ],
  exports: [
    UserService,
    UserPreferencesService,
    RgpdExportService,
    UserRepository,
    UserPreferencesRepository,
    UserSessionRepository,
    RgpdExportRepository,
  ],
})
export class UsersModule {}
