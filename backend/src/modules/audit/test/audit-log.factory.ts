import { AuditLog, AuditLogProps } from '../domain/entities/audit-log.entity';
import { Severity } from '../domain/enums/severity.enum';

export type MockAuditLogOptions = Partial<AuditLogProps>;

const DEFAULT_PROPS: AuditLogProps = {
  id: 'audit-123',
  actorUserId: 'user-123',
  action: 'user.ban',
  resourceType: 'user',
  resourceId: 'target-456',
  before: { status: 'active' },
  after: { status: 'banned' },
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  severity: Severity.WARNING,
  success: true,
  errorMessage: null,
  createdAt: new Date('2025-01-01'),
};

function mergeWithDefaults(options: MockAuditLogOptions): AuditLogProps {
  return { ...DEFAULT_PROPS, ...options };
}

export function createMockAuditLog(options: MockAuditLogOptions = {}): AuditLog {
  return AuditLog.fromProps(mergeWithDefaults(options));
}

export function createMockAuditLogResponse(options: MockAuditLogOptions = {}): AuditLogProps {
  return mergeWithDefaults(options);
}
