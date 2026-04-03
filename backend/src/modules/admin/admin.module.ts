import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminMeController } from './presentation/controllers/admin-me.controller';
import { AdminRolesGuard } from './presentation/guards/admin-roles.guard';
import { AdminMfaGuard } from './presentation/guards/admin-mfa.guard';
import { AdminMfaController } from './presentation/controllers/admin-mfa.controller';
import { AdminCsrfController } from './presentation/controllers/admin-csrf.controller';
import { AdminCsrfGuard } from './presentation/guards/admin-csrf.guard';
import { SuperAdminGuard } from './presentation/guards/super-admin.guard';
import { AdminSuperController } from './presentation/controllers/admin-super.controller';
import { AdminUsersTestController } from './presentation/controllers/admin-users-test.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EUser, UserSessionEntity } from 'src/infrastructure/database/entities';
import { AdminUsersService } from './application/admin-users.service';
import { AuditModule } from '../audit/audit.module';
import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { forwardRef } from '@nestjs/common';
import { SecurityLogEntity } from 'src/infrastructure/database/entities/security-log.entity';
import { BlockedIpEntity } from 'src/infrastructure/database/entities/blocked-ip.entity';
import { SecurityPolicyEntity } from 'src/infrastructure/database/entities/security-policy.entity';
import { AdminSecurityService } from './application/admin-security.service';
import { AdminSecurityController } from './presentation/controllers/admin-security.controller';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      EUser,
      UserSessionEntity,
      SecurityLogEntity,
      BlockedIpEntity,
      SecurityPolicyEntity,
    ]),
  ],
  controllers: [
    AdminMeController,
    AdminMfaController,
    AdminCsrfController,
    AdminSuperController,
    AdminUsersTestController,
    AdminUsersController,
    AdminSecurityController,
  ],
  providers: [
    AdminRolesGuard,
    AdminMfaGuard,
    AdminCsrfGuard,
    SuperAdminGuard,
    AdminUsersService,
    AdminSecurityService,
  ],
  exports: [AdminSecurityService],
})
export class AdminModule {}
