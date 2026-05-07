import { AuditLog, AuditLogProps } from './audit-log.entity';
import { Severity } from '../enums/severity.enum';

describe('AuditLog Entity', () => {
  const baseCreateParams = {
    actorUserId: 'user-123',
    action: 'user.login',
    resourceType: 'user',
  };

  describe('AuditLog.create factory', () => {
    it('should create an AuditLog with required fields', () => {
      const log = AuditLog.create(baseCreateParams);

      expect(log.getActorUserId()).toBe('user-123');
      expect(log.getAction()).toBe('user.login');
      expect(log.getResourceType()).toBe('user');
      expect(log.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should default optional fields to null/defaults', () => {
      const log = AuditLog.create(baseCreateParams);

      expect(log.getResourceId()).toBeNull();
      expect(log.getBefore()).toBeNull();
      expect(log.getAfter()).toBeNull();
      expect(log.getIpAddress()).toBeNull();
      expect(log.getUserAgent()).toBeNull();
      expect(log.getSeverity()).toBe(Severity.INFO);
      expect(log.isSuccess()).toBe(true);
      expect(log.getErrorMessage()).toBeNull();
    });

    it('should accept all optional fields', () => {
      const log = AuditLog.create({
        ...baseCreateParams,
        resourceId: 'res-456',
        before: { old: 'value' },
        after: { new: 'value' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        severity: Severity.WARNING,
        success: false,
        errorMessage: 'Something went wrong',
      });

      expect(log.getResourceId()).toBe('res-456');
      expect(log.getBefore()).toEqual({ old: 'value' });
      expect(log.getAfter()).toEqual({ new: 'value' });
      expect(log.getIpAddress()).toBe('192.168.1.1');
      expect(log.getUserAgent()).toBe('Mozilla/5.0');
      expect(log.getSeverity()).toBe(Severity.WARNING);
      expect(log.isSuccess()).toBe(false);
      expect(log.getErrorMessage()).toBe('Something went wrong');
    });

    it('should create with actorUserId as null', () => {
      const log = AuditLog.create({
        actorUserId: null,
        action: 'system.action',
        resourceType: 'system',
      });

      expect(log.getActorUserId()).toBeNull();
    });
  });

  describe('AuditLog.fromProps factory', () => {
    it('should reconstitute from full props', () => {
      const createdAt = new Date('2025-01-01T10:00:00.000Z');
      const props: AuditLogProps = {
        id: 'audit-1',
        actorUserId: 'admin-1',
        action: 'user.ban',
        resourceType: 'user',
        resourceId: 'user-2',
        before: { status: 'active' },
        after: { status: 'banned' },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome',
        severity: Severity.WARNING,
        success: true,
        errorMessage: null,
        createdAt,
      };

      const log = AuditLog.fromProps(props);

      expect(log.getId()).toBe('audit-1');
      expect(log.hasId()).toBe(true);
      expect(log.getActorUserId()).toBe('admin-1');
      expect(log.getAction()).toBe('user.ban');
      expect(log.getResourceType()).toBe('user');
      expect(log.getResourceId()).toBe('user-2');
      expect(log.getBefore()).toEqual({ status: 'active' });
      expect(log.getAfter()).toEqual({ status: 'banned' });
      expect(log.getIpAddress()).toBe('10.0.0.1');
      expect(log.getUserAgent()).toBe('Chrome');
      expect(log.getSeverity()).toBe(Severity.WARNING);
      expect(log.isSuccess()).toBe(true);
      expect(log.getErrorMessage()).toBeNull();
      expect(log.getCreatedAt()).toEqual(createdAt);
    });

    it('should return hasId() = false when id is not set', () => {
      const props: AuditLogProps = {
        actorUserId: 'user-1',
        action: 'read',
        resourceType: 'resource',
        resourceId: null,
        before: null,
        after: null,
        ipAddress: null,
        userAgent: null,
        severity: Severity.INFO,
        success: true,
        errorMessage: null,
        createdAt: new Date(),
      };

      const log = AuditLog.fromProps(props);

      expect(log.hasId()).toBe(false);
    });

    it('should throw when getId() is called without an id', () => {
      const props: AuditLogProps = {
        actorUserId: 'user-1',
        action: 'read',
        resourceType: 'resource',
        resourceId: null,
        before: null,
        after: null,
        ipAddress: null,
        userAgent: null,
        severity: Severity.INFO,
        success: true,
        errorMessage: null,
        createdAt: new Date(),
      };

      const log = AuditLog.fromProps(props);

      expect(() => log.getId()).toThrow('AuditLog ID is not defined');
    });
  });

  describe('toProps', () => {
    it('should return all props as a plain object', () => {
      const createdAt = new Date('2025-06-01T00:00:00.000Z');
      const props: AuditLogProps = {
        id: 'audit-2',
        actorUserId: 'user-1',
        action: 'update',
        resourceType: 'subscription',
        resourceId: 'sub-1',
        before: { amount: 10 },
        after: { amount: 20 },
        ipAddress: '1.2.3.4',
        userAgent: 'Firefox',
        severity: Severity.INFO,
        success: true,
        errorMessage: null,
        createdAt,
      };

      const log = AuditLog.fromProps(props);
      const result = log.toProps();

      expect(result).toEqual(props);
      expect(result).not.toBe(props); // Should be a copy
    });
  });
});
