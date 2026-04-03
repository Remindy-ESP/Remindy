import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminRolesGuard } from '../guards/admin-roles.guard';

export function AdminPreMfa() {
  return applyDecorators(ApiBearerAuth('access-token'), UseGuards(AdminRolesGuard));
}
