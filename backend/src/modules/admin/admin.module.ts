import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { DocumentModule } from '../document/document.module';
import { SubscriptionEntity } from 'src/modules/subscription/infrastructure/persistence/subscription.entity';
import { EUser, UserSessionEntity } from 'src/infrastructure/database/entities';
import { SecurityLogEntity } from 'src/infrastructure/database/entities/security-log.entity';
import { BlockedIpEntity } from 'src/infrastructure/database/entities/blocked-ip.entity';
import { SecurityPolicyEntity } from 'src/infrastructure/database/entities/security-policy.entity';
import { RolePermissionEntity } from 'src/infrastructure/database/entities/role-permission.entity';
import { RoleEntity } from 'src/infrastructure/database/entities/role.entity';
import { AdminMeController } from './presentation/controllers/admin-me.controller';
import { AdminMfaController } from './presentation/controllers/admin-mfa.controller';
import { AdminCsrfController } from './presentation/controllers/admin-csrf.controller';
import { AdminSuperController } from './presentation/controllers/admin-super.controller';
import { AdminUsersTestController } from './presentation/controllers/admin-users-test.controller';
import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { AdminSecurityController } from './presentation/controllers/admin-security.controller';
import { AdminCloudController } from './presentation/controllers/admin-cloud.controller';
import { AdminRbacController } from './presentation/controllers/admin-rbac.controller';
import { AdminRolesGuard } from './presentation/guards/admin-roles.guard';
import { AdminMfaGuard } from './presentation/guards/admin-mfa.guard';
import { AdminCsrfGuard } from './presentation/guards/admin-csrf.guard';
import { SuperAdminGuard } from './presentation/guards/super-admin.guard';
import { AdminUsersService } from './application/admin-users.service';
import { AdminSecurityService } from './application/admin-security.service';
import { AdminCloudService } from './application/admin-cloud.service';
import { DocumentEntity } from 'src/modules/document/infrastructure/persistence/document.entity';
import { RgpdExportEntity } from 'src/infrastructure/database/entities/rgpd-export.entity';
import { AdminRgpdController } from './presentation/controllers/admin-rgpd.controller';
import { AdminRgpdService } from './application/admin-rgpd.service';
import { AdminRbacService } from './application/admin-rbac.service';
import { AdminAuditController } from './presentation/controllers/admin-audit.controller';
import { AdminAuditService } from './application/admin-audit.service';
@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    forwardRef(() => DocumentModule),
    TypeOrmModule.forFeature([
      EUser,
      UserSessionEntity,
      SecurityLogEntity,
      BlockedIpEntity,
      SecurityPolicyEntity,
      SubscriptionEntity,
      DocumentEntity,
      RgpdExportEntity,
      RoleEntity,
      RolePermissionEntity,
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
    AdminCloudController,
    AdminRgpdController,
    AdminRbacController,
    AdminAuditController,
  ],
  providers: [
    AdminRolesGuard,
    AdminMfaGuard,
    AdminCsrfGuard,
    SuperAdminGuard,
    AdminUsersService,
    AdminSecurityService,
    AdminCloudService,
    AdminRgpdService,
    AdminRbacService,
    AdminAuditService,
  ],
  exports: [AdminSecurityService],
})
export class AdminModule {}
