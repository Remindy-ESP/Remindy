import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  AuditLogFilterRequestDto,
  ExportAuditLogsRequestDto,
  AuditStatsRequestDto,
} from './audit-log-filter.request.dto';
import { Severity } from '../../domain/enums/severity.enum';

describe('AuditLogFilterRequestDto', () => {
  it('should validate with no filters (all optional)', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all filters', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      actorUserId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'user.ban',
      resourceType: 'user',
      resourceId: 'target-123',
      severity: Severity.WARNING,
      success: true,
      dateFrom: '2025-01-01T00:00:00.000Z',
      dateTo: '2025-12-31T23:59:59.999Z',
      search: 'test search',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid UUID for actorUserId', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      actorUserId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'actorUserId')).toBe(true);
  });

  it('should fail with invalid date format', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      dateFrom: 'invalid-date',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'dateFrom')).toBe(true);
  });

  it('should fail with page less than 1', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      page: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'page')).toBe(true);
  });

  it('should fail with limit greater than 100', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      limit: 101,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'limit')).toBe(true);
  });

  it('should validate sortBy options', async () => {
    const sortByOptions = ['createdAt', 'action', 'severity'];
    for (const sortBy of sortByOptions) {
      const dto = plainToClass(AuditLogFilterRequestDto, { sortBy });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail with invalid sortBy', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      sortBy: 'invalid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate sortOrder options', async () => {
    const sortOrders = ['ASC', 'DESC'];
    for (const sortOrder of sortOrders) {
      const dto = plainToClass(AuditLogFilterRequestDto, { sortOrder });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should transform success string to boolean', async () => {
    const dto = plainToClass(AuditLogFilterRequestDto, {
      success: 'true',
    });
    expect(dto.success).toBe(true);
  });
});

describe('ExportAuditLogsRequestDto', () => {
  it('should validate with no options', async () => {
    const dto = plainToClass(ExportAuditLogsRequestDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate format options', async () => {
    const formats = ['csv', 'json'];
    for (const format of formats) {
      const dto = plainToClass(ExportAuditLogsRequestDto, { format });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail with invalid format', async () => {
    const dto = plainToClass(ExportAuditLogsRequestDto, {
      format: 'xml',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'format')).toBe(true);
  });

  it('should validate with all filters', async () => {
    const dto = plainToClass(ExportAuditLogsRequestDto, {
      format: 'csv',
      actorUserId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'user.ban',
      resourceType: 'user',
      severity: Severity.CRITICAL,
      success: false,
      dateFrom: '2025-01-01T00:00:00.000Z',
      dateTo: '2025-01-31T23:59:59.999Z',
      search: 'test',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('AuditStatsRequestDto', () => {
  it('should validate with no date range', async () => {
    const dto = plainToClass(AuditStatsRequestDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with date range', async () => {
    const dto = plainToClass(AuditStatsRequestDto, {
      dateFrom: '2025-01-01T00:00:00.000Z',
      dateTo: '2025-12-31T23:59:59.999Z',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid dateFrom', async () => {
    const dto = plainToClass(AuditStatsRequestDto, {
      dateFrom: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'dateFrom')).toBe(true);
  });

  it('should fail with invalid dateTo', async () => {
    const dto = plainToClass(AuditStatsRequestDto, {
      dateTo: '2025/01/01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'dateTo')).toBe(true);
  });
});
