import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AdminUsersTestController } from './admin-users-test.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockUsers = {
  findOne: jest.fn(),
};

describe('AdminUsersTestController', () => {
  let controller: AdminUsersTestController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersTestController],
      providers: [{ provide: getRepositoryToken(EUser), useValue: mockUsers }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard)
      .useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminUsersTestController);
  });

  describe('suspend()', () => {
    it('suspends a regular user when actor is SUPER_ADMIN', async () => {
      mockUsers.findOne.mockResolvedValue({ id: 'user-1', role_key: Role.USER_FREEMIUM });

      const req = { user: { role: Role.SUPER_ADMIN } };
      const result = await controller.suspend(req, 'user-1');

      expect(result).toEqual({ ok: true, targetId: 'user-1', targetRole: Role.USER_FREEMIUM });
    });

    it('throws ForbiddenException when USER_ADMIN tries to suspend a SUPER_ADMIN', async () => {
      mockUsers.findOne.mockResolvedValue({ id: 'super-1', role_key: Role.SUPER_ADMIN });

      const req = { user: { role: Role.USER_ADMIN } };
      await expect(controller.suspend(req, 'super-1')).rejects.toThrow(ForbiddenException);
    });

    it('handles case where target user is not found (undefined role)', async () => {
      mockUsers.findOne.mockResolvedValue(null);

      const req = { user: { role: Role.SUPER_ADMIN } };
      const result = await controller.suspend(req, 'ghost');

      // target?.role_key is undefined, assertCanActOnUser with undefined role should not throw for SUPER_ADMIN
      expect(result).toMatchObject({ ok: true, targetId: 'ghost' });
    });
  });
});
