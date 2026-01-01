import { AuditLogMapper } from './audit-log.mapper';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { Severity } from '../../domain/enums/severity.enum';
import { createMockAuditLog, createMockAuditLogResponse } from '../../test/audit-log.factory';

function createMockEntity(overrides: Partial<AdminAuditLogEntity> = {}): AdminAuditLogEntity {
  const defaults = createMockAuditLogResponse({ createdAt: new Date('2025-01-01T10:00:00.000Z') });
  const entity = new AdminAuditLogEntity();
  Object.assign(entity, defaults, overrides);
  return entity;
}

describe('AuditLogMapper', () => {
  let mapper: AuditLogMapper;

  beforeEach(() => {
    mapper = new AuditLogMapper();
  });

  describe('toDomain', () => {
    it('should map AdminAuditLogEntity to AuditLog domain with all fields', () => {
      const entity = createMockEntity();

      const domain = mapper.toDomain(entity);

      expect(domain.getId()).toBe(entity.id);
      expect(domain.getActorUserId()).toBe(entity.actorUserId);
      expect(domain.getAction()).toBe(entity.action);
      expect(domain.getResourceType()).toBe(entity.resourceType);
      expect(domain.getResourceId()).toBe(entity.resourceId);
      expect(domain.getBefore()).toEqual(entity.before);
      expect(domain.getAfter()).toEqual(entity.after);
      expect(domain.getIpAddress()).toBe(entity.ipAddress);
      expect(domain.getUserAgent()).toBe(entity.userAgent);
      expect(domain.getSeverity()).toBe(entity.severity);
      expect(domain.isSuccess()).toBe(entity.success);
      expect(domain.getErrorMessage()).toBe(entity.errorMessage);
      expect(domain.getCreatedAt()).toEqual(entity.createdAt);
    });

    it('should map AdminAuditLogEntity with null optional fields', () => {
      const entity = createMockEntity({
        id: 'audit-456',
        actorUserId: null,
        action: 'system.cleanup',
        resourceType: 'sessions',
        resourceId: null,
        before: null,
        after: null,
        ipAddress: null,
        userAgent: null,
        severity: Severity.INFO,
      });

      const domain = mapper.toDomain(entity);

      expect(domain.getActorUserId()).toBeNull();
      expect(domain.getResourceId()).toBeNull();
      expect(domain.getBefore()).toBeNull();
      expect(domain.getAfter()).toBeNull();
      expect(domain.getIpAddress()).toBeNull();
      expect(domain.getUserAgent()).toBeNull();
      expect(domain.getErrorMessage()).toBeNull();
    });

    it('should map failed audit log with error message', () => {
      const entity = createMockEntity({
        id: 'audit-789',
        action: 'user.delete',
        resourceId: 'target-999',
        before: null,
        after: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        severity: Severity.CRITICAL,
        success: false,
        errorMessage: 'User not found',
      });

      const domain = mapper.toDomain(entity);

      expect(domain.isSuccess()).toBe(false);
      expect(domain.getErrorMessage()).toBe('User not found');
      expect(domain.getSeverity()).toBe(Severity.CRITICAL);
    });
  });

  describe('toEntity', () => {
    it('should map AuditLog domain to AdminAuditLogEntity', () => {
      const domain = createMockAuditLog({ createdAt: new Date('2025-01-01T10:00:00.000Z') });

      const entity = mapper.toEntity(domain);

      expect(entity).toBeInstanceOf(AdminAuditLogEntity);
      expect(entity.id).toBe(domain.getId());
      expect(entity.actorUserId).toBe(domain.getActorUserId());
      expect(entity.action).toBe(domain.getAction());
      expect(entity.resourceType).toBe(domain.getResourceType());
      expect(entity.resourceId).toBe(domain.getResourceId());
      expect(entity.before).toEqual(domain.getBefore());
      expect(entity.after).toEqual(domain.getAfter());
      expect(entity.ipAddress).toBe(domain.getIpAddress());
      expect(entity.userAgent).toBe(domain.getUserAgent());
      expect(entity.severity).toBe(domain.getSeverity());
      expect(entity.success).toBe(domain.isSuccess());
      expect(entity.errorMessage).toBe(domain.getErrorMessage());
      expect(entity.createdAt).toEqual(domain.getCreatedAt());
    });

    it('should map AuditLog domain without id (new entity)', () => {
      const domain = AuditLog.create({
        actorUserId: 'user-456',
        action: 'user.view',
        resourceType: 'user',
      });

      const entity = mapper.toEntity(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.actorUserId).toBe('user-456');
      expect(entity.action).toBe('user.view');
    });

    it('should map AuditLog domain with null values', () => {
      const domain = createMockAuditLog({
        id: 'audit-system',
        actorUserId: null,
        action: 'system.cleanup',
        resourceType: 'sessions',
        resourceId: null,
        before: null,
        after: null,
        ipAddress: null,
        userAgent: null,
        severity: Severity.INFO,
        success: true,
        errorMessage: null,
        createdAt: new Date(),
      });

      const entity = mapper.toEntity(domain);

      expect(entity.actorUserId).toBeNull();
      expect(entity.resourceId).toBeNull();
      expect(entity.before).toBeNull();
      expect(entity.after).toBeNull();
      expect(entity.ipAddress).toBeNull();
      expect(entity.userAgent).toBeNull();
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity when mapping to entity and back to domain', () => {
      const originalDomain = createMockAuditLog({
        before: { status: 'active', role: 'user' },
        after: { status: 'banned', role: 'user' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        severity: Severity.WARNING,
        success: true,
        errorMessage: null,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });

      const entity = mapper.toEntity(originalDomain);
      const mappedDomain = mapper.toDomain(entity);

      expect(mappedDomain.getId()).toBe(originalDomain.getId());
      expect(mappedDomain.getActorUserId()).toBe(originalDomain.getActorUserId());
      expect(mappedDomain.getAction()).toBe(originalDomain.getAction());
      expect(mappedDomain.getResourceType()).toBe(originalDomain.getResourceType());
      expect(mappedDomain.getResourceId()).toBe(originalDomain.getResourceId());
      expect(mappedDomain.getBefore()).toEqual(originalDomain.getBefore());
      expect(mappedDomain.getAfter()).toEqual(originalDomain.getAfter());
      expect(mappedDomain.getIpAddress()).toBe(originalDomain.getIpAddress());
      expect(mappedDomain.getUserAgent()).toBe(originalDomain.getUserAgent());
      expect(mappedDomain.getSeverity()).toBe(originalDomain.getSeverity());
      expect(mappedDomain.isSuccess()).toBe(originalDomain.isSuccess());
      expect(mappedDomain.getCreatedAt()).toEqual(originalDomain.getCreatedAt());
    });
  });
});
