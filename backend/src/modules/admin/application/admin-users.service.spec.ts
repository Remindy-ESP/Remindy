import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';


const mockUsersRepo = {
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockSessionsRepo = {
  delete: jest.fn(),
};

const makeService = () =>
  new AdminUsersService(mockUsersRepo as any, mockSessionsRepo as any);

const superAdmin = { id: 'actor-1', role: Role.SUPER_ADMIN };
const userAdmin  = { id: 'actor-2', role: Role.USER_ADMIN };

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  role_key: Role.USER,
  status: UserStatus.ACTIVE,
  emailVerified: false,
  mfaEnabled: false,
  passwordChangedAt: null,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


describe('admin-user.policy — assertCanActOnUser', () => {
  const { assertCanActOnUser } = jest.requireActual('../domain/policies/admin-user.policy');

  it('SUPER_ADMIN peut agir sur un USER', () => {
    expect(() =>
      assertCanActOnUser({ actorRole: Role.SUPER_ADMIN, targetRole: Role.USER, action: 'ban' }),
    ).not.toThrow();
  });

  it('SUPER_ADMIN peut agir sur un autre SUPER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({ actorRole: Role.SUPER_ADMIN, targetRole: Role.SUPER_ADMIN, action: 'ban' }),
    ).not.toThrow();
  });

  it('USER_ADMIN peut agir sur un USER classique', () => {
    expect(() =>
      assertCanActOnUser({ actorRole: Role.USER_ADMIN, targetRole: Role.USER, action: 'ban' }),
    ).not.toThrow();
  });

  it('USER_ADMIN ne peut PAS agir sur un SUPER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({ actorRole: Role.USER_ADMIN, targetRole: Role.SUPER_ADMIN, action: 'ban' }),
    ).toThrow(ForbiddenException);
  });

  it('USER_ADMIN ne peut PAS agir sur un autre USER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({ actorRole: Role.USER_ADMIN, targetRole: Role.USER_ADMIN, action: 'ban' }),
    ).toThrow(ForbiddenException);
  });
});


describe('AdminUsersService.ban()', () => {
  it('banne un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().ban(superAdmin, 'user-1', 'spam');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { status: UserStatus.BANNED });
    expect(result).toEqual({ ok: true, status: UserStatus.BANNED, reason: 'spam' });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de bannir un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().ban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
  });

  it('lève une ForbiddenException si USER_ADMIN tente de bannir un autre USER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.USER_ADMIN }));

    await expect(makeService().ban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
  });

  it('lève une NotFoundException si le user n\'existe pas', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().ban(superAdmin, 'unknown')).rejects.toThrow(NotFoundException);
  });
});


describe('AdminUsersService.unban()', () => {
  it('débanne un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ status: UserStatus.BANNED }));
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().unban(superAdmin, 'user-1');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { status: UserStatus.ACTIVE });
    expect(result).toEqual({ ok: true, status: UserStatus.ACTIVE });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de débannir un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().unban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
  });
});


describe('AdminUsersService.revokeSessions()', () => {
  it('révoque les sessions d\'un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockSessionsRepo.delete.mockResolvedValue({});

    const result = await makeService().revokeSessions(superAdmin, 'user-1');

    expect(mockSessionsRepo.delete).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(result).toEqual({ ok: true });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de révoquer les sessions d\'un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().revokeSessions(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockSessionsRepo.delete).not.toHaveBeenCalled();
  });

  it('lève une NotFoundException si le user n\'existe pas', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().revokeSessions(superAdmin, 'unknown')).rejects.toThrow(NotFoundException);
  });
});


describe('AdminUsersService.resetPassword()', () => {
  it('met à jour passwordChangedAt', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const before = new Date();
    const result = await makeService().resetPassword(superAdmin, 'user-1');
    const after = new Date();

    expect(mockUsersRepo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordChangedAt: expect.any(Date),
      }),
    );

    const calledDate: Date = mockUsersRepo.update.mock.calls[0][1].passwordChangedAt;
    expect(calledDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(calledDate.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result).toEqual({ ok: true });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de reset le password d\'un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().resetPassword(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
  });
});


describe('AdminUsersService.verifyEmail()', () => {
  it('vérifie l\'email d\'un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().verifyEmail(superAdmin, 'user-1');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { emailVerified: true });
    expect(result).toEqual({ ok: true, emailVerified: true });
  });

  it('lève une ForbiddenException si USER_ADMIN agit sur un USER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.USER_ADMIN }));

    await expect(makeService().verifyEmail(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
  });
});


describe('AdminUsersService.forceMfa()', () => {
  it('active le MFA d\'un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().forceMfa(superAdmin, 'user-1');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { mfaEnabled: true });
    expect(result).toEqual({ ok: true, mfaEnabled: true });
  });

  it('lève une ForbiddenException si USER_ADMIN agit sur un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().forceMfa(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
  });
});