import { AuditExportService } from './audit-export.service';
import { createMockAuditLog } from '../../test/audit-log.factory';
import { Severity } from '../../domain/enums/severity.enum';

describe('AuditExportService', () => {
  let service: AuditExportService;

  beforeEach(() => {
    service = new AuditExportService();
  });

  describe('toCsv', () => {
    it('should export CSV with headers and escaped JSON/strings', () => {
      const log = createMockAuditLog({
        id: 'audit-1',
        actorUserId: null,
        action: 'user.update',
        resourceType: 'user',
        resourceId: 'res-1',
        before: { note: 'hello, "world"' },
        after: { note: 'line1\nline2' },
        ipAddress: null,
        userAgent: 'Agent,1',
        severity: Severity.WARNING,
        success: false,
        errorMessage: 'boom, "error"',
        createdAt: new Date('2026-02-22T12:34:56.000Z'),
      });

      const csv = service.toCsv([log]);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'id,actor_user_id,action,resource_type,resource_id,before,after,ip_address,user_agent,severity,success,error_message,created_at',
      );
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('audit-1');
      expect(lines[1]).toContain('user.update');
      expect(lines[1]).toContain('warning');
      expect(lines[1]).toContain('false');
      expect(lines[1]).toContain('"Agent,1"');
      expect(lines[1]).toContain('"boom, ""error"""');
      expect(lines[1]).toContain('hello,');
      expect(lines[1]).toContain('\\nline2');
      expect(lines[1]).toContain('2026-02-22T12:34:56.000Z');
    });

    it('should export only headers for empty input', () => {
      expect(service.toCsv([])).toBe(
        'id,actor_user_id,action,resource_type,resource_id,before,after,ip_address,user_agent,severity,success,error_message,created_at',
      );
    });
  });

  describe('toJson', () => {
    it('should export logs as pretty JSON with ISO dates', () => {
      const log = createMockAuditLog({
        id: 'audit-json-1',
        before: { nested: { ok: true } },
        after: null,
        createdAt: new Date('2026-02-22T00:00:00.000Z'),
      });

      const json = service.toJson([log]);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toMatchObject({
        id: 'audit-json-1',
        before: { nested: { ok: true } },
        after: null,
      });
      expect(parsed[0].createdAt).toBe('2026-02-22T00:00:00.000Z');
      expect(json).toContain('\n  {');
    });
  });
});
