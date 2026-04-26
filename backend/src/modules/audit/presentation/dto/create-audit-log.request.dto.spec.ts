import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateAuditLogRequestDto } from './create-audit-log.request.dto';
import { Severity } from '../../domain/enums/severity.enum';

describe('CreateAuditLogRequestDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.ban',
      resourceType: 'user',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.ban',
      resourceType: 'user',
      resourceId: '123e4567-e89b-12d3-a456-426614174000',
      before: { status: 'active' },
      after: { status: 'banned' },
      severity: Severity.WARNING,
      success: true,
      errorMessage: null,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if action is missing', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      resourceType: 'user',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'action')).toBe(true);
  });

  it('should fail if resourceType is missing', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.ban',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'resourceType')).toBe(true);
  });

  it('should fail if action exceeds max length', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'a'.repeat(101),
      resourceType: 'user',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if resourceType exceeds max length', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.ban',
      resourceType: 'a'.repeat(51),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate all severity levels', async () => {
    const severities = [Severity.INFO, Severity.WARNING, Severity.CRITICAL];
    for (const severity of severities) {
      const dto = plainToClass(CreateAuditLogRequestDto, {
        action: 'test.action',
        resourceType: 'test',
        severity,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should fail with invalid severity', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'test.action',
      resourceType: 'test',
      severity: 'invalid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'severity')).toBe(true);
  });

  it('should validate with before/after objects', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.update',
      resourceType: 'user',
      before: { email: 'old@test.com', role: 'user' },
      after: { email: 'new@test.com', role: 'admin' },
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with success false and error message', async () => {
    const dto = plainToClass(CreateAuditLogRequestDto, {
      action: 'user.delete',
      resourceType: 'user',
      success: false,
      errorMessage: 'User not found',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
