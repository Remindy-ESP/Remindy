import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';

export function AdminPreMfa() {
  return applyDecorators(UseGuards(JwtAuthGuard, AdminRolesGuard));
}
