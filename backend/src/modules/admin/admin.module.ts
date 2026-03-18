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
@Module({
  imports: [AuthModule, AuditModule, TypeOrmModule.forFeature([EUser, UserSessionEntity])],
  controllers: [
    AdminMeController,
    AdminMfaController,
    AdminCsrfController,
    AdminSuperController,
    AdminUsersTestController,
    AdminUsersController,
  ],
  providers: [AdminRolesGuard, AdminMfaGuard, AdminCsrfGuard, SuperAdminGuard, AdminUsersService],
})
export class AdminModule {}
