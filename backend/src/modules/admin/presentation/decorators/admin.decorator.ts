import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';

export function Admin() {
  return applyDecorators(UseGuards(JwtAuthGuard, AdminRolesGuard, AdminMfaGuard, AdminCsrfGuard));
}
