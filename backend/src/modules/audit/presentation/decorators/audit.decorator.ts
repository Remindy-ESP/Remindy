import { SetMetadata } from '@nestjs/common';
import { Severity } from '../../domain/enums/severity.enum';

export const AUDIT_KEY = 'audit:config';

export interface AuditConfig {
  action: string;
  resourceType: string;
  resourceIdParam?: string; // Route param name for resource ID (e.g., 'id')
  resourceIdBody?: string; // Body field name for resource ID
  severity?: Severity;
}

/**
 * Decorator to mark a controller method for automatic audit logging.
 *
 * @example
 * // Simple usage
 * @Audit({ action: 'user.ban', resourceType: 'user', resourceIdParam: 'id' })
 * async banUser(@Param('id') id: string) { ... }
 *
 * @example
 * // With severity
 * @Audit({ action: 'user.delete', resourceType: 'user', resourceIdParam: 'id', severity: Severity.CRITICAL })
 * async deleteUser(@Param('id') id: string) { ... }
 *
 * @example
 * // With body resource ID
 * @Audit({ action: 'subscription.create', resourceType: 'subscription', resourceIdBody: 'id' })
 * async createSubscription(@Body() dto: CreateDto) { ... }
 */
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);
