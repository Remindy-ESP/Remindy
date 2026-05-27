import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { RoleRepository } from '../../../infrastructure/repositories/role.repository';
import { RoleLimitRepository } from '../../../infrastructure/repositories/role-limit.repository';
import { RoleEntity } from '../../../../../infrastructure/database/entities/role.entity';
import { RoleLimitEntity } from '../../../../../infrastructure/database/entities/role-limit.entity';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<RoleRepository>;
  let roleLimitRepository: jest.Mocked<RoleLimitRepository>;

  beforeEach(async () => {
    const mockRoleRepository = {
      findByKey: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    };

    const mockRoleLimitRepository = {
      findByRole: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
        {
          provide: RoleLimitRepository,
          useValue: mockRoleLimitRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(RoleRepository);
    roleLimitRepository = module.get(RoleLimitRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoleByKey', () => {
    it('should return a role when it exists', async () => {
      const roleKey = 'free';
      const expectedRole = new RoleEntity();
      expectedRole.key = roleKey;
      expectedRole.label = 'Free';
      (expectedRole as any).description = 'Free tier';

      roleRepository.findByKey.mockResolvedValue(expectedRole);

      const result = await service.getRoleByKey(roleKey);

      expect(result).toBe(expectedRole);
      expect(roleRepository.findByKey).toHaveBeenCalledWith(roleKey);
      expect(roleRepository.findByKey).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleKey = 'non-existent';

      roleRepository.findByKey.mockResolvedValue(null);

      await expect(service.getRoleByKey(roleKey)).rejects.toThrow(NotFoundException);
      await expect(service.getRoleByKey(roleKey)).rejects.toThrow(
        `Role with key '${roleKey}' not found`,
      );

      expect(roleRepository.findByKey).toHaveBeenCalledWith(roleKey);
    });

    it('should return premium role', async () => {
      const roleKey = 'premium';
      const expectedRole = new RoleEntity();
      expectedRole.key = roleKey;
      expectedRole.label = 'Premium';

      roleRepository.findByKey.mockResolvedValue(expectedRole);

      const result = await service.getRoleByKey(roleKey);

      expect(result.key).toBe('premium');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const expectedRoles = [
        Object.assign(new RoleEntity(), { key: 'free', label: 'Free' }),
        Object.assign(new RoleEntity(), { key: 'premium', label: 'Premium' }),
        Object.assign(new RoleEntity(), { key: 'enterprise', label: 'Enterprise' }),
      ];

      roleRepository.findAll.mockResolvedValue(expectedRoles);

      const result = await service.getAllRoles();

      expect(result).toBe(expectedRoles);
      expect(result).toHaveLength(3);
      expect(roleRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no roles exist', async () => {
      roleRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('getRoleLimits', () => {
    it('should return role limits when they exist', async () => {
      const roleKey = 'free';
      const role = new RoleEntity();
      role.key = roleKey;

      const expectedLimits = new RoleLimitEntity();
      expectedLimits.role = roleKey;
      expectedLimits.maxSubscriptions = 5;
      expectedLimits.maxRemindersPerSubscription = 10;

      roleRepository.findByKey.mockResolvedValue(role);
      roleLimitRepository.findByRole.mockResolvedValue(expectedLimits);

      const result = await service.getRoleLimits(roleKey);

      expect(result).toBe(expectedLimits);
      expect(roleRepository.findByKey).toHaveBeenCalledWith(roleKey);
      expect(roleLimitRepository.findByRole).toHaveBeenCalledWith(roleKey);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleKey = 'non-existent';

      roleRepository.findByKey.mockResolvedValue(null);

      await expect(service.getRoleLimits(roleKey)).rejects.toThrow(NotFoundException);
      await expect(service.getRoleLimits(roleKey)).rejects.toThrow(
        `Role with key '${roleKey}' not found`,
      );

      expect(roleLimitRepository.findByRole).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role limits do not exist', async () => {
      const roleKey = 'free';
      const role = new RoleEntity();
      role.key = roleKey;

      roleRepository.findByKey.mockResolvedValue(role);
      roleLimitRepository.findByRole.mockResolvedValue(null);

      await expect(service.getRoleLimits(roleKey)).rejects.toThrow(NotFoundException);
      await expect(service.getRoleLimits(roleKey)).rejects.toThrow(
        `Limits for role '${roleKey}' not found`,
      );
    });

    it('should return limits for premium role', async () => {
      const roleKey = 'premium';
      const role = new RoleEntity();
      role.key = roleKey;

      const expectedLimits = new RoleLimitEntity();
      expectedLimits.role = roleKey;
      expectedLimits.maxSubscriptions = 50;
      expectedLimits.maxRemindersPerSubscription = 100;

      roleRepository.findByKey.mockResolvedValue(role);
      roleLimitRepository.findByRole.mockResolvedValue(expectedLimits);

      const result = await service.getRoleLimits(roleKey);

      expect(result.maxSubscriptions).toBe(50);
      expect(result.maxRemindersPerSubscription).toBe(100);
    });
  });

  describe('getAllRoleLimits', () => {
    it('should return all role limits', async () => {
      const expectedLimits = [
        Object.assign(new RoleLimitEntity(), {
          role: 'free',
          maxSubscriptions: 5,
          maxRemindersPerSubscription: 10,
        }),
        Object.assign(new RoleLimitEntity(), {
          role: 'premium',
          maxSubscriptions: 50,
          maxRemindersPerSubscription: 100,
        }),
      ];

      roleLimitRepository.findAll.mockResolvedValue(expectedLimits);

      const result = await service.getAllRoleLimits();

      expect(result).toBe(expectedLimits);
      expect(result).toHaveLength(2);
      expect(roleLimitRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no limits exist', async () => {
      roleLimitRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllRoleLimits();

      expect(result).toEqual([]);
    });
  });

  describe('roleExists', () => {
    it('should return true when role exists', async () => {
      const roleKey = 'free';

      roleRepository.exists.mockResolvedValue(true);

      const result = await service.roleExists(roleKey);

      expect(result).toBe(true);
      expect(roleRepository.exists).toHaveBeenCalledWith(roleKey);
    });

    it('should return false when role does not exist', async () => {
      const roleKey = 'non-existent';

      roleRepository.exists.mockResolvedValue(false);

      const result = await service.roleExists(roleKey);

      expect(result).toBe(false);
      expect(roleRepository.exists).toHaveBeenCalledWith(roleKey);
    });

    it('should check existence for premium role', async () => {
      const roleKey = 'premium';

      roleRepository.exists.mockResolvedValue(true);

      const result = await service.roleExists(roleKey);

      expect(result).toBe(true);
    });

    it('should check existence for enterprise role', async () => {
      const roleKey = 'enterprise';

      roleRepository.exists.mockResolvedValue(true);

      const result = await service.roleExists(roleKey);

      expect(result).toBe(true);
    });
  });
});
