import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const mockEventEmitter = {
  emit: jest.fn(),
  emitAsync: jest.fn(),
};

// Inner Brackets builder mock - simulates the TypeORM Brackets callback
const mockBracketsQb = {
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
};

const mockQb = {
  andWhere: jest.fn().mockImplementation(function (this: any, arg: any) {
    // If it's a Brackets instance, invoke the callback so it gets coverage
    if (arg && typeof arg === 'object' && arg.constructor && arg.constructor.name === 'Brackets') {
      arg.whereFactory(mockBracketsQb);
    }
    return this;
  }),
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockUsersRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  findOne: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
};

const mockSessionsRepo = {
  delete: jest.fn(),
};

const makeService = () =>
  new AdminUsersService(mockUsersRepo as any, mockSessionsRepo as any, mockEventEmitter as any);

const superAdmin = { id: 'actor-1', role: Role.SUPER_ADMIN };
const userAdmin = { id: 'actor-2', role: Role.USER_ADMIN };

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  role_key: Role.USER_FREEMIUM,
  status: UserStatus.ACTIVE,
  emailVerified: false,
  mfaEnabled: false,
  passwordChangedAt: null,
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  lastLoginAt: null,
  failedLoginCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  sessions: [],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUsersRepo.createQueryBuilder.mockReturnValue(mockQb);
  mockQb.getManyAndCount.mockResolvedValue([[], 0]);
});

describe('admin-user.policy — assertCanActOnUser', () => {
  const { assertCanActOnUser } = jest.requireActual('../domain/policies/admin-user.policy');

  it('SUPER_ADMIN peut agir sur un USER', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.SUPER_ADMIN,
        targetRole: Role.USER_FREEMIUM,
        action: 'ban',
      }),
    ).not.toThrow();
  });

  it('SUPER_ADMIN peut agir sur un autre SUPER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.SUPER_ADMIN,
        targetRole: Role.SUPER_ADMIN,
        action: 'ban',
      }),
    ).not.toThrow();
  });

  it('USER_ADMIN peut agir sur un USER classique', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.USER_ADMIN,
        targetRole: Role.USER_FREEMIUM,
        action: 'ban',
      }),
    ).not.toThrow();
  });

  it('USER_ADMIN ne peut PAS agir sur un SUPER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.USER_ADMIN,
        targetRole: Role.SUPER_ADMIN,
        action: 'ban',
      }),
    ).toThrow(ForbiddenException);
  });

  it('USER_ADMIN ne peut PAS agir sur un autre USER_ADMIN', () => {
    expect(() =>
      assertCanActOnUser({
        actorRole: Role.USER_ADMIN,
        targetRole: Role.USER_ADMIN,
        action: 'ban',
      }),
    ).toThrow(ForbiddenException);
  });
});

describe('AdminUsersService.list()', () => {
  it('returns paginated user list', async () => {
    const users = [makeUser(), makeUser({ id: 'user-2' })];
    mockQb.getManyAndCount.mockResolvedValue([users, 2]);

    const result = await makeService().list(superAdmin, {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('applies q filter with single word', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      q: 'john',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalled();
  });

  it('applies q filter with two words (firstName + lastName)', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      q: 'John Doe',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalled();
  });

  it('applies role filter', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      role: Role.USER_FREEMIUM,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalledWith('u.role_key = :role', {
      role: Role.USER_FREEMIUM,
    });
  });

  it('applies status filter', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      status: UserStatus.BANNED,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalledWith('u.status = :status', {
      status: UserStatus.BANNED,
    });
  });

  it('applies emailVerified filter', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      emailVerified: true,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalledWith('u.emailVerified = :ev', { ev: true });
  });

  it('applies mfaEnabled filter', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      mfaEnabled: false,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.andWhere).toHaveBeenCalledWith('u.mfaEnabled = :mfa', { mfa: false });
  });

  it('applies pagination with skip and take', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);
    await makeService().list(superAdmin, {
      page: 3,
      limit: 10,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);
    expect(mockQb.skip).toHaveBeenCalledWith(20);
    expect(mockQb.take).toHaveBeenCalledWith(10);
  });

  it('maps user fields in items correctly', async () => {
    const user = makeUser();
    mockQb.getManyAndCount.mockResolvedValue([[user], 1]);

    const result = await makeService().list(superAdmin, {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'DESC',
    } as any);

    expect(result.items[0]).toMatchObject({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role_key,
      status: user.status,
    });
  });
});

describe('AdminUsersService.getById()', () => {
  it('returns user with sessions count', async () => {
    const user = makeUser({ sessions: [{ id: 's1' }, { id: 's2' }] });
    mockUsersRepo.findOne.mockResolvedValue(user);

    const result = await makeService().getById(superAdmin, 'user-1');
    expect(result.id).toBe('user-1');
    expect(result.sessionsCount).toBe(2);
  });

  it('returns sessionsCount of 0 when sessions is undefined', async () => {
    const user = makeUser({ sessions: undefined });
    mockUsersRepo.findOne.mockResolvedValue(user);

    const result = await makeService().getById(superAdmin, 'user-1');
    expect(result.sessionsCount).toBe(0);
  });

  it('throws NotFoundException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);
    await expect(makeService().getById(superAdmin, 'ghost')).rejects.toThrow(NotFoundException);
  });
});

describe('AdminUsersService.ban()', () => {
  it('banne un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().ban(superAdmin, 'user-1', 'spam');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { status: UserStatus.BANNED });
    expect(result).toEqual({ ok: true, status: UserStatus.BANNED, reason: 'spam' });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.admin.user.banned', {
      actorId: superAdmin.id,
      targetUserId: 'user-1',
      reason: 'spam',
    });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de bannir un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().ban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('lève une ForbiddenException si USER_ADMIN tente de bannir un autre USER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.USER_ADMIN }));

    await expect(makeService().ban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it("lève une NotFoundException si le user n'existe pas", async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().ban(superAdmin, 'unknown')).rejects.toThrow(NotFoundException);
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('bans without reason when reason is undefined', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().ban(superAdmin, 'user-1');
    expect(result.reason).toBeUndefined();
  });
});

describe('AdminUsersService.unban()', () => {
  it('débanne un user classique', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ status: UserStatus.BANNED }));
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().unban(superAdmin, 'user-1');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { status: UserStatus.ACTIVE });
    expect(result).toEqual({ ok: true, status: UserStatus.ACTIVE });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.admin.user.unbanned', {
      actorId: superAdmin.id,
      targetUserId: 'user-1',
    });
  });

  it('lève une ForbiddenException si USER_ADMIN tente de débannir un SUPER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().unban(userAdmin, 'user-1')).rejects.toThrow(ForbiddenException);
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);
    await expect(makeService().unban(superAdmin, 'ghost')).rejects.toThrow(NotFoundException);
  });
});

describe('AdminUsersService.revokeSessions()', () => {
  it("révoque les sessions d'un user classique", async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockSessionsRepo.delete.mockResolvedValue({});

    const result = await makeService().revokeSessions(superAdmin, 'user-1');

    expect(mockSessionsRepo.delete).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(result).toEqual({ ok: true });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.admin.session.revoked', {
      actorId: superAdmin.id,
      targetUserId: 'user-1',
    });
  });

  it("lève une ForbiddenException si USER_ADMIN tente de révoquer les sessions d'un SUPER_ADMIN", async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().revokeSessions(userAdmin, 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockSessionsRepo.delete).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it("lève une NotFoundException si le user n'existe pas", async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(makeService().revokeSessions(superAdmin, 'unknown')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
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

  it("lève une ForbiddenException si USER_ADMIN tente de reset le password d'un SUPER_ADMIN", async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.SUPER_ADMIN }));

    await expect(makeService().resetPassword(userAdmin, 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUsersRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);
    await expect(makeService().resetPassword(superAdmin, 'ghost')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('AdminUsersService.verifyEmail()', () => {
  it("vérifie l'email d'un user classique", async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser());
    mockUsersRepo.update.mockResolvedValue({});

    const result = await makeService().verifyEmail(superAdmin, 'user-1');

    expect(mockUsersRepo.update).toHaveBeenCalledWith('user-1', { emailVerified: true });
    expect(result).toEqual({ ok: true, emailVerified: true });
  });

  it('lève une ForbiddenException si USER_ADMIN agit sur un USER_ADMIN', async () => {
    mockUsersRepo.findOne.mockResolvedValue(makeUser({ role_key: Role.USER_ADMIN }));

    await expect(makeService().verifyEmail(userAdmin, 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);
    await expect(makeService().verifyEmail(superAdmin, 'ghost')).rejects.toThrow(NotFoundException);
  });
});

describe('AdminUsersService.forceMfa()', () => {
  it("active le MFA d'un user classique", async () => {
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

  it('throws NotFoundException when user not found', async () => {
    mockUsersRepo.findOne.mockResolvedValue(null);
    await expect(makeService().forceMfa(superAdmin, 'ghost')).rejects.toThrow(NotFoundException);
  });
});
