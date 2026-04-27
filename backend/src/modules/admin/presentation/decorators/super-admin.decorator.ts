import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

export function SuperAdmin() {
  return applyDecorators(UseGuards(JwtAuthGuard, SuperAdminGuard, AdminMfaGuard, AdminCsrfGuard));
}
