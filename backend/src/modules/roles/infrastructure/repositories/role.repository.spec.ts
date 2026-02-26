import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRepository } from './role.repository';
import { RoleEntity } from '../../../../infrastructure/database/entities/role.entity';

describe('RoleRepository', () => {
  let repository: RoleRepository;
  let mockRepository: jest.Mocked<Repository<RoleEntity>>;

  const mockRole: RoleEntity = {
    key: 'user_freemium',
    label: 'Utilisateur Freemium',
    description: 'Utilisateur avec accès gratuit limité',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    users: [],
    limit: null,
  };

  const mockRoles: RoleEntity[] = [
    mockRole,
    {
      key: 'user_premium',
      label: 'Utilisateur Premium',
      description: 'Utilisateur avec accès premium complet',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      users: [],
      limit: null,
    },
    {
      key: 'user_admin',
      label: 'Administrateur',
      description: "Administrateur de l'application",
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      users: [],
      limit: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleRepository,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<RoleRepository>(RoleRepository);
    mockRepository = module.get(getRepositoryToken(RoleEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByKey', () => {
    it('should find a role by key', async () => {
      mockRepository.findOne.mockResolvedValue(mockRole);

      const result = await repository.findByKey('user_freemium');

      expect(result).toEqual(mockRole);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'user_freemium' },
      });
    });

    it('should return null if role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByKey('non_existent_role');

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'non_existent_role' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all roles ordered by key', async () => {
      mockRepository.find.mockResolvedValue(mockRoles);

      const result = await repository.findAll();

      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(3);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          key: 'ASC',
        },
      });
    });

    it('should return empty array when no roles exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new role with all fields', async () => {
      const createData = {
        key: 'user_enterprise',
        label: 'Utilisateur Entreprise',
        description: 'Utilisateur avec accès entreprise',
      };

      const createdRole: RoleEntity = {
        ...createData,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        users: [],
        limit: null,
      };

      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await repository.create(createData);

      expect(result).toEqual(createdRole);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdRole);
    });

    it('should create a role without description', async () => {
      const createData = {
        key: 'user_basic',
        label: 'Utilisateur Basique',
      };

      const createdRole: RoleEntity = {
        key: 'user_basic',
        label: 'Utilisateur Basique',
        description: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        users: [],
        limit: null,
      };

      mockRepository.create.mockReturnValue(createdRole);
      mockRepository.save.mockResolvedValue(createdRole);

      const result = await repository.create(createData);

      expect(result.key).toBe('user_basic');
      expect(result.label).toBe('Utilisateur Basique');
      expect(result.description).toBeNull();
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a role and return the updated entity', async () => {
      const updateData = {
        label: 'Freemium User Updated',
        description: 'Updated description',
      };

      const updatedRole: RoleEntity = {
        ...mockRole,
        ...updateData,
        updatedAt: new Date('2025-01-02'),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedRole);

      const result = await repository.update('user_freemium', updateData);

      expect(result).toEqual(updatedRole);
      expect(mockRepository.update).toHaveBeenCalledWith({ key: 'user_freemium' }, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'user_freemium' },
      });
    });

    it('should return null if role to update does not exist', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non_existent_role', {
        label: 'Test',
      });

      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should update only label', async () => {
      const updateData = {
        label: 'New Label',
      };

      const updatedRole: RoleEntity = {
        ...mockRole,
        label: 'New Label',
        updatedAt: new Date('2025-01-02'),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedRole);

      const result = await repository.update('user_freemium', updateData);

      expect(result?.label).toBe('New Label');
      expect(result?.description).toBe(mockRole.description);
      expect(mockRepository.update).toHaveBeenCalledWith({ key: 'user_freemium' }, updateData);
    });

    it('should update only description', async () => {
      const updateData = {
        description: 'New description',
      };

      const updatedRole: RoleEntity = {
        ...mockRole,
        description: 'New description',
        updatedAt: new Date('2025-01-02'),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedRole);

      const result = await repository.update('user_freemium', updateData);

      expect(result?.description).toBe('New description');
      expect(result?.label).toBe(mockRole.label);
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('user_freemium');

      expect(mockRepository.delete).toHaveBeenCalledWith({ key: 'user_freemium' });
    });

    it('should not throw error when deleting non-existent role', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.delete('non_existent_role')).resolves.not.toThrow();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        key: 'non_existent_role',
      });
    });
  });

  describe('exists', () => {
    it('should return true if role exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.exists('user_freemium');

      expect(result).toBe(true);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { key: 'user_freemium' },
      });
    });

    it('should return false if role does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await repository.exists('non_existent_role');

      expect(result).toBe(false);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { key: 'non_existent_role' },
      });
    });

    it('should return true even if multiple roles match (edge case)', async () => {
      mockRepository.count.mockResolvedValue(2);

      const result = await repository.exists('user_freemium');

      expect(result).toBe(true);
    });
  });
});
