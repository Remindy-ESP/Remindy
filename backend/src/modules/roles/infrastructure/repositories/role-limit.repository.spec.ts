import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleLimitRepository } from './role-limit.repository';
import { RoleLimitEntity } from '../../../../infrastructure/database/entities/role-limit.entity';
import { RoleEntity } from '../../../../infrastructure/database/entities/role.entity';

describe('RoleLimitRepository', () => {
  let repository: RoleLimitRepository;
  let mockRepository: jest.Mocked<Repository<RoleLimitEntity>>;

  const mockRoleLimit: RoleLimitEntity = {
    role: 'user_freemium',
    maxSubscriptions: 5,
    maxDocuments: 10,
    maxDocumentSizeMb: 5,
    maxRemindersPerSubscription: 3,
    canExportData: false,
    canUseOcr: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    roleEntity: null as unknown as RoleEntity,
  };

  const mockRoleLimits: RoleLimitEntity[] = [
    mockRoleLimit,
    {
      role: 'user_premium',
      maxSubscriptions: 100,
      maxDocuments: 500,
      maxDocumentSizeMb: 50,
      maxRemindersPerSubscription: 10,
      canExportData: true,
      canUseOcr: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      roleEntity: null as unknown as RoleEntity,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleLimitRepository,
        {
          provide: getRepositoryToken(RoleLimitEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<RoleLimitRepository>(RoleLimitRepository);
    mockRepository = module.get(getRepositoryToken(RoleLimitEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByRole', () => {
    it('should find a role limit by role key', async () => {
      mockRepository.findOne.mockResolvedValue(mockRoleLimit);

      const result = await repository.findByRole('user_freemium');

      expect(result).toEqual(mockRoleLimit);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: 'user_freemium' },
      });
    });

    it('should return null if role limit not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByRole('non_existent_role');

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: 'non_existent_role' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all role limits ordered by role', async () => {
      mockRepository.find.mockResolvedValue(mockRoleLimits);

      const result = await repository.findAll();

      expect(result).toEqual(mockRoleLimits);
      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          role: 'ASC',
        },
      });
    });

    it('should return empty array when no role limits exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new role limit with all fields', async () => {
      const createData = {
        role: 'user_enterprise',
        maxSubscriptions: 1000,
        maxDocuments: 5000,
        maxDocumentSizeMb: 100,
        maxRemindersPerSubscription: 20,
        canExportData: true,
        canUseOcr: true,
      };

      const createdRoleLimit: RoleLimitEntity = {
        ...createData,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        roleEntity: null as unknown as RoleEntity,
      };

      mockRepository.create.mockReturnValue(createdRoleLimit);
      mockRepository.save.mockResolvedValue(createdRoleLimit);

      const result = await repository.create(createData);

      expect(result).toEqual(createdRoleLimit);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdRoleLimit);
    });

    it('should create a role limit with only required fields', async () => {
      const createData = {
        role: 'user_basic',
      };

      const createdRoleLimit: RoleLimitEntity = {
        role: 'user_basic',
        maxSubscriptions: null as unknown as number,
        maxDocuments: null as unknown as number,
        maxDocumentSizeMb: null as unknown as number,
        maxRemindersPerSubscription: null as unknown as number,
        canExportData: null as unknown as boolean,
        canUseOcr: null as unknown as boolean,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        roleEntity: null as unknown as RoleEntity,
      };

      mockRepository.create.mockReturnValue(createdRoleLimit);
      mockRepository.save.mockResolvedValue(createdRoleLimit);

      const result = await repository.create(createData);

      expect(result.role).toBe('user_basic');
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a role limit and return the updated entity', async () => {
      const updateData = {
        maxSubscriptions: 15,
        maxDocuments: 50,
      };

      const updatedRoleLimit: RoleLimitEntity = {
        ...mockRoleLimit,
        ...updateData,
        updatedAt: new Date('2025-01-02'),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedRoleLimit);

      const result = await repository.update('user_freemium', updateData);

      expect(result).toEqual(updatedRoleLimit);
      expect(mockRepository.update).toHaveBeenCalledWith({ role: 'user_freemium' }, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: 'user_freemium' },
      });
    });

    it('should return null if role limit to update does not exist', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non_existent_role', {
        maxSubscriptions: 10,
      });

      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should update single field', async () => {
      const updateData = {
        canExportData: true,
      };

      const updatedRoleLimit: RoleLimitEntity = {
        ...mockRoleLimit,
        canExportData: true,
        updatedAt: new Date('2025-01-02'),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedRoleLimit);

      const result = await repository.update('user_freemium', updateData);

      expect(result?.canExportData).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith({ role: 'user_freemium' }, updateData);
    });
  });

  describe('delete', () => {
    it('should delete a role limit', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('user_freemium');

      expect(mockRepository.delete).toHaveBeenCalledWith({ role: 'user_freemium' });
    });

    it('should not throw error when deleting non-existent role limit', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.delete('non_existent_role')).resolves.not.toThrow();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        role: 'non_existent_role',
      });
    });
  });
});
