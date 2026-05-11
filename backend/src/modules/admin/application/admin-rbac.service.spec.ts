import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AdminRbacService } from './admin-rbac.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

jest.mock('../presentation/permissions/admin-permissions.map', () => ({
  AdminPermissions: {
    RBAC_READ: 'admin.rbac.read',
    RBAC_WRITE: 'admin.rbac.write',
    USERS_READ: 'admin.users.read',
  },
  permissionsForRole: (role: Role) => {
    if (role === Role.SUPER_ADMIN)
      return ['admin.rbac.read', 'admin.rbac.write', 'admin.users.read'];
    if (role === Role.USER_ADMIN) return ['admin.rbac.read'];
    return [];
  },
}));

const mockRolesRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockPermissionsRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const makeService = () => new AdminRbacService(mockRolesRepo as any, mockPermissionsRepo as any);

const superAdmin = { role: Role.SUPER_ADMIN };
const userAdmin = { role: Role.USER_ADMIN };

const makeRole = (overrides: Partial<any> = {}) => ({
  key: 'user_freemium',
  label: 'User Freemium',
  description: 'Free tier',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const makePermRow = (roleKey: string, permission: string) => ({
  id: 'perm-uuid',
  roleKey,
  permission,
  createdAt: new Date(),
});

beforeEach(() => jest.clearAllMocks());

describe('AdminRbacService.listRoles()', () => {
  it('retourne les rôles avec leurs permissions pivot', async () => {
    mockRolesRepo.find.mockResolvedValue([makeRole()]);
    mockPermissionsRepo.find.mockResolvedValue([makePermRow('user_freemium', 'admin.users.read')]);

    const result = await makeService().listRoles(superAdmin);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('user_freemium');
    expect(result[0].permissions).toEqual(['admin.users.read']);
    expect(result[0].isSystem).toBe(false);
  });

  it("lève ForbiddenException si le rôle n'a pas RBAC_READ", async () => {
    await expect(makeService().listRoles({ role: Role.USER })).rejects.toThrow(ForbiddenException);
    expect(mockRolesRepo.find).not.toHaveBeenCalled();
  });

  it('USER_ADMIN peut lister (il a RBAC_READ)', async () => {
    mockRolesRepo.find.mockResolvedValue([makeRole()]);
    mockPermissionsRepo.find.mockResolvedValue([]);

    await expect(makeService().listRoles(userAdmin)).resolves.toBeDefined();
  });
});

describe('AdminRbacService.createRole()', () => {
  it('crée un rôle avec succès', async () => {
    mockRolesRepo.findOne.mockResolvedValue(null);
    const created = makeRole({ key: 'user_vip', label: 'VIP' });
    mockRolesRepo.create.mockReturnValue(created);
    mockRolesRepo.save.mockResolvedValue(created);

    const result = await makeService().createRole(superAdmin, { key: 'user_vip', label: 'VIP' });

    expect(mockRolesRepo.save).toHaveBeenCalled();
    expect(result.key).toBe('user_vip');
    expect(result.permissions).toEqual([]);
  });

  it('lève ConflictException si la clé existe déjà', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());

    await expect(
      makeService().createRole(superAdmin, { key: 'user_freemium', label: 'X' }),
    ).rejects.toThrow(ConflictException);
    expect(mockRolesRepo.save).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente de créer (pas RBAC_WRITE)', async () => {
    await expect(
      makeService().createRole(userAdmin, { key: 'user_vip', label: 'VIP' }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('AdminRbacService.updateRole()', () => {
  it("met à jour le label d'un rôle non-système", async () => {
    const role = makeRole();
    mockRolesRepo.findOne.mockResolvedValue(role);
    mockPermissionsRepo.find.mockResolvedValue([]);
    mockRolesRepo.save.mockResolvedValue({ ...role, label: 'New label' });

    const result = await makeService().updateRole(superAdmin, 'user_freemium', {
      label: 'New label',
    });

    expect(result.label).toBe('New label');
  });

  it('met à jour description et retourne les permissions dans la liste', async () => {
    const role = makeRole();
    mockRolesRepo.findOne.mockResolvedValue(role);
    mockPermissionsRepo.find.mockResolvedValue([makePermRow('user_freemium', 'admin.rbac.read')]);
    mockRolesRepo.save.mockResolvedValue({ ...role, description: 'Updated desc' });

    const result = await makeService().updateRole(superAdmin, 'user_freemium', {
      description: 'Updated desc',
    });

    expect(result.description).toBe('Updated desc');
    expect(result.permissions).toEqual(['admin.rbac.read']);
  });

  it('lève BadRequestException si on tente de modifier un rôle système', async () => {
    await expect(
      makeService().updateRole(superAdmin, 'super_admin', { label: 'X' }),
    ).rejects.toThrow(BadRequestException);
    expect(mockRolesRepo.findOne).not.toHaveBeenCalled();
  });

  it("lève NotFoundException si le rôle n'existe pas", async () => {
    mockRolesRepo.findOne.mockResolvedValue(null);

    await expect(makeService().updateRole(superAdmin, 'unknown', { label: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('AdminRbacService.deleteRole()', () => {
  it('supprime un rôle non-système', async () => {
    const role = makeRole();
    mockRolesRepo.findOne.mockResolvedValue(role);
    mockRolesRepo.remove.mockResolvedValue(role);

    const result = await makeService().deleteRole(superAdmin, 'user_freemium');

    expect(mockRolesRepo.remove).toHaveBeenCalledWith(role);
    expect(result).toEqual({ ok: true, key: 'user_freemium' });
  });

  it('lève BadRequestException si on tente de supprimer un rôle système', async () => {
    await expect(makeService().deleteRole(superAdmin, 'user_admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRolesRepo.remove).not.toHaveBeenCalled();
  });

  it("lève NotFoundException si le rôle n'existe pas", async () => {
    mockRolesRepo.findOne.mockResolvedValue(null);

    await expect(makeService().deleteRole(superAdmin, 'unknown')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('AdminRbacService.addPermission()', () => {
  it('ajoute une permission et retourne la liste complète', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());
    mockPermissionsRepo.findOne.mockResolvedValue(null); // pas encore assignée
    mockPermissionsRepo.create.mockReturnValue(makePermRow('user_freemium', 'admin.users.read'));
    mockPermissionsRepo.save.mockResolvedValue({});
    mockPermissionsRepo.find.mockResolvedValue([makePermRow('user_freemium', 'admin.users.read')]);

    const result = await makeService().addPermission(
      superAdmin,
      'user_freemium',
      'admin.users.read',
    );

    expect(mockPermissionsRepo.save).toHaveBeenCalled();
    expect(result.permissions).toContain('admin.users.read');
  });

  it('lève ConflictException si la permission est déjà assignée', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());
    mockPermissionsRepo.findOne.mockResolvedValue(makePermRow('user_freemium', 'admin.users.read'));

    await expect(
      makeService().addPermission(superAdmin, 'user_freemium', 'admin.users.read'),
    ).rejects.toThrow(ConflictException);
    expect(mockPermissionsRepo.save).not.toHaveBeenCalled();
  });

  it('lève BadRequestException si la permission est inconnue', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());

    await expect(
      makeService().addPermission(superAdmin, 'user_freemium', 'admin.invalid.perm'),
    ).rejects.toThrow(BadRequestException);
  });

  it("lève NotFoundException si le rôle n'existe pas", async () => {
    mockRolesRepo.findOne.mockResolvedValue(null);

    await expect(
      makeService().addPermission(superAdmin, 'unknown', 'admin.users.read'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AdminRbacService.removePermission()', () => {
  it('retire une permission et retourne la liste restante', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());
    mockPermissionsRepo.findOne.mockResolvedValue(makePermRow('user_freemium', 'admin.users.read'));
    mockPermissionsRepo.remove.mockResolvedValue({});
    mockPermissionsRepo.find.mockResolvedValue([]); // plus rien

    const result = await makeService().removePermission(
      superAdmin,
      'user_freemium',
      'admin.users.read',
    );

    expect(mockPermissionsRepo.remove).toHaveBeenCalled();
    expect(result.permissions).toEqual([]);
  });

  it('retourne les permissions restantes après suppression (liste non vide)', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());
    mockPermissionsRepo.findOne.mockResolvedValue(makePermRow('user_freemium', 'admin.users.read'));
    mockPermissionsRepo.remove.mockResolvedValue({});
    mockPermissionsRepo.find.mockResolvedValue([makePermRow('user_freemium', 'admin.rbac.read')]);

    const result = await makeService().removePermission(
      superAdmin,
      'user_freemium',
      'admin.users.read',
    );

    expect(result.permissions).toEqual(['admin.rbac.read']);
  });

  it("lève NotFoundException si la permission n'est pas assignée", async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());
    mockPermissionsRepo.findOne.mockResolvedValue(null);

    await expect(
      makeService().removePermission(superAdmin, 'user_freemium', 'admin.users.read'),
    ).rejects.toThrow(NotFoundException);
    expect(mockPermissionsRepo.remove).not.toHaveBeenCalled();
  });

  it('lève BadRequestException si la permission est inconnue', async () => {
    mockRolesRepo.findOne.mockResolvedValue(makeRole());

    await expect(
      makeService().removePermission(superAdmin, 'user_freemium', 'admin.invalid'),
    ).rejects.toThrow(BadRequestException);
  });
});
