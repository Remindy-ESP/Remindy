import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminRgpdService } from './admin-rgpd.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminPermissions } from '../presentation/permissions/admin.permissions';

jest.mock('../presentation/permissions/admin-permissions.map', () => ({
  AdminPermissions: {
    RGPD_EXPORT: 'admin.rgpd.export',
    RGPD_DELETE: 'admin.rgpd.delete',
  },
  permissionsForRole: (role: Role) => {
    if (role === Role.SUPER_ADMIN)
      return Object.values({ RGPD_EXPORT: 'admin.rgpd.export', RGPD_DELETE: 'admin.rgpd.delete' });
    return [];
  },
}));

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({}),
  getOne: jest.fn(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockUsersRepo = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQb),
};

const mockExportsRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQb),
};

const makeService = () => new AdminRgpdService(mockUsersRepo as any, mockExportsRepo as any);

const superAdmin = { id: 'actor-super', role: Role.SUPER_ADMIN };
const userAdmin = { id: 'actor-admin', role: Role.USER_ADMIN };
const meta = { ipAddress: '127.0.0.1' };

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  role_key: Role.USER,
  ...overrides,
});

const makeExport = (overrides: Partial<any> = {}) => ({
  id: 'export-1',
  userId: 'user-1',
  status: 'pending',
  format: 'json',
  requestedBy: 'admin',
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminRgpdService.requestExport()', () => {
  it('crée un export pending pour un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockExportsRepo.findOne.mockResolvedValue(null);
    mockQb.getOne.mockResolvedValue(null);
    const saved = makeExport();
    mockExportsRepo.create.mockReturnValue(saved);
    mockExportsRepo.save.mockResolvedValue(saved);

    const result = await makeService().requestExport(superAdmin, 'user-1', meta);

    expect(mockExportsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        status: 'pending',
        format: 'json',
        requestedBy: 'admin',
        ipAddress: '127.0.0.1',
      }),
    );
    expect(mockExportsRepo.save).toHaveBeenCalledWith(saved);
    expect(result).toEqual(saved);
  });

  it("lève NotFoundException si l'user n'existe pas", async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().requestExport(superAdmin, 'unknown', meta)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockExportsRepo.save).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente un export sur SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().requestExport(userAdmin, 'user-1', meta)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockExportsRepo.save).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente un export (réservé SUPER_ADMIN)', async () => {
    await expect(makeService().requestExport(userAdmin, 'user-1', meta)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUsersRepo.findOne).not.toHaveBeenCalled();
    expect(mockExportsRepo.save).not.toHaveBeenCalled();
  });

  it('lève ConflictException si un export est déjà pending/processing', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockExportsRepo.findOne.mockResolvedValue(makeExport({ status: 'processing' }));

    await expect(makeService().requestExport(superAdmin, 'user-1', meta)).rejects.toThrow(
      ConflictException,
    );
    expect(mockExportsRepo.save).not.toHaveBeenCalled();
  });

  it('lève ConflictException si un export admin a été fait il y a moins de 60 min (cooldown)', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockExportsRepo.findOne.mockResolvedValue(null);
    mockQb.getOne.mockResolvedValue(makeExport({ status: 'completed' }));

    await expect(makeService().requestExport(superAdmin, 'user-1', meta)).rejects.toThrow(
      ConflictException,
    );
    expect(mockExportsRepo.save).not.toHaveBeenCalled();
  });
});

describe('AdminRgpdService.listExports()', () => {
  it('retourne la liste paginée des exports', async () => {
    const exports = [makeExport(), makeExport({ id: 'export-2' })];
    mockQb.getManyAndCount.mockResolvedValue([exports, 2]);

    const result = await makeService().listExports(superAdmin, { page: 1, limit: 20 });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('filtre par userId quand fourni', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);

    await makeService().listExports(superAdmin, { userId: 'user-1', page: 1, limit: 20 });

    expect(mockQb.andWhere).toHaveBeenCalledWith('e.userId = :userId', { userId: 'user-1' });
  });

  it('filtre par status quand fourni', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);

    await makeService().listExports(superAdmin, { status: 'completed', page: 1, limit: 20 });

    expect(mockQb.andWhere).toHaveBeenCalledWith('e.status = :status', { status: 'completed' });
  });

  it('filtre par requestedBy quand fourni', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);

    await makeService().listExports(superAdmin, { requestedBy: 'admin', page: 1, limit: 20 });

    expect(mockQb.andWhere).toHaveBeenCalledWith('e.requestedBy = :requestedBy', {
      requestedBy: 'admin',
    });
  });

  it('lève ForbiddenException si USER_ADMIN tente de lister les exports', async () => {
    await expect(makeService().listExports(userAdmin, { page: 1, limit: 20 })).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockQb.getManyAndCount).not.toHaveBeenCalled();
  });
});

describe('AdminRgpdService.deleteUserData()', () => {
  it("anonymise les données personnelles d'un user classique", async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockQb.execute.mockResolvedValue({});

    const result = await makeService().deleteUserData(superAdmin, 'user-1', meta);

    expect(result.ok).toBe(true);
    expect(result.userId).toBe('user-1');
    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(mockUsersRepo.createQueryBuilder).toHaveBeenCalled();
    expect(mockQb.set).toHaveBeenCalled();
    expect(mockQb.execute).toHaveBeenCalled();
  });

  it("lève NotFoundException si l'user n'existe pas", async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().deleteUserData(superAdmin, 'unknown', meta)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockQb.execute).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente de supprimer (réservé SUPER_ADMIN)', async () => {
    await expect(makeService().deleteUserData(userAdmin, 'user-1', meta)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUsersRepo.findOne).not.toHaveBeenCalled();
    expect(mockQb.execute).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente de supprimer un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().deleteUserData(userAdmin, 'user-1', meta)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockQb.execute).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente de supprimer un autre USER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.USER_ADMIN }));

    await expect(makeService().deleteUserData(userAdmin, 'user-1', meta)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockQb.execute).not.toHaveBeenCalled();
  });
});
