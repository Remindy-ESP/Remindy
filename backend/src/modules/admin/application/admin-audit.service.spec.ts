import { ForbiddenException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminAuditQueryDto } from '../presentation/dto/admin-audit-query.dto';

const mockFindAllAuditLogs = {
  execute: jest.fn(),
};

const makeService = () => new AdminAuditService(mockFindAllAuditLogs as any);

const superAdmin = { role: Role.SUPER_ADMIN };
const userAdmin = { role: Role.USER_ADMIN };
const regularUser = { role: Role.USER_FREEMIUM as any };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminAuditService.list()', () => {
  it('calls findAllAuditLogs.execute with correct parameters for SUPER_ADMIN', async () => {
    const logs = [{ id: 'log-1' }];
    mockFindAllAuditLogs.execute.mockResolvedValue({ items: logs, total: 1 });

    const query = {
      page: 1,
      limit: 20,
    } as AdminAuditQueryDto;

    const result = await makeService().list(superAdmin, query);

    expect(mockFindAllAuditLogs.execute).toHaveBeenCalledWith({
      actorUserId: undefined,
      action: undefined,
      resourceType: undefined,
      resourceId: undefined,
      severity: undefined,
      success: undefined,
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      page: 1,
      limit: 20,
    });
    expect(result).toEqual({ items: logs, total: 1 });
  });

  it('calls findAllAuditLogs.execute for USER_ADMIN (has AUDIT_READ permission)', async () => {
    mockFindAllAuditLogs.execute.mockResolvedValue({ items: [], total: 0 });

    const query = { page: 1, limit: 20 } as AdminAuditQueryDto;
    await expect(makeService().list(userAdmin, query)).resolves.not.toThrow();
    expect(mockFindAllAuditLogs.execute).toHaveBeenCalled();
  });

  it('throws ForbiddenException for role without AUDIT_READ permission', async () => {
    const query = { page: 1, limit: 20 } as AdminAuditQueryDto;
    await expect(makeService().list(regularUser, query)).rejects.toThrow(ForbiddenException);
    expect(mockFindAllAuditLogs.execute).not.toHaveBeenCalled();
  });

  it('maps query fields to execute parameters including all optional fields', async () => {
    mockFindAllAuditLogs.execute.mockResolvedValue({ items: [], total: 0 });

    const query: AdminAuditQueryDto = {
      actor: 'user-1',
      action: 'user.ban',
      resource: 'user',
      resourceId: 'res-1',
      severity: 'WARNING' as any,
      success: true,
      search: 'test',
      from: '2024-01-01',
      to: '2024-12-31',
      sortBy: 'createdAt' as any,
      sortOrder: 'DESC' as any,
      page: 2,
      limit: 50,
    };

    await makeService().list(superAdmin, query);

    expect(mockFindAllAuditLogs.execute).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      action: 'user.ban',
      resourceType: 'user',
      resourceId: 'res-1',
      severity: 'WARNING',
      success: true,
      search: 'test',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-12-31'),
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      page: 2,
      limit: 50,
    });
  });

  it('passes undefined for dateFrom/dateTo when from/to are not provided', async () => {
    mockFindAllAuditLogs.execute.mockResolvedValue({ items: [], total: 0 });

    const query = { page: 1, limit: 20 } as AdminAuditQueryDto;
    await makeService().list(superAdmin, query);

    expect(mockFindAllAuditLogs.execute).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: undefined, dateTo: undefined }),
    );
  });

  it('converts from/to strings to Date objects', async () => {
    mockFindAllAuditLogs.execute.mockResolvedValue({ items: [], total: 0 });

    const query = {
      from: '2024-01-15',
      to: '2024-06-30',
      page: 1,
      limit: 20,
    } as AdminAuditQueryDto;

    await makeService().list(superAdmin, query);

    const call = mockFindAllAuditLogs.execute.mock.calls[0][0];
    expect(call.dateFrom).toBeInstanceOf(Date);
    expect(call.dateTo).toBeInstanceOf(Date);
  });

  it('throws ForbiddenException with permission name in message', async () => {
    const query = { page: 1, limit: 20 } as AdminAuditQueryDto;
    await expect(makeService().list(regularUser, query)).rejects.toThrow('admin.audit.read');
  });
});
