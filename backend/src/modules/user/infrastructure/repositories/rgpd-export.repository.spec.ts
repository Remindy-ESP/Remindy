import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RgpdExportRepository } from './rgpd-export.repository';
import { RgpdExportEntity } from '../../../../infrastructure/database/entities/rgpd-export.entity';

describe('RgpdExportRepository', () => {
  let repository: RgpdExportRepository;
  let typeOrmRepository: jest.Mocked<Repository<RgpdExportEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RgpdExportRepository,
        {
          provide: getRepositoryToken(RgpdExportEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<RgpdExportRepository>(RgpdExportRepository);
    typeOrmRepository = module.get(getRepositoryToken(RgpdExportEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find an export request by id', async () => {
      const exportEntity = new RgpdExportEntity();
      exportEntity.id = 'export-123';
      exportEntity.userId = 'user-123';
      exportEntity.status = 'completed';
      exportEntity.format = 'json';
      exportEntity.requestedBy = 'user';
      exportEntity.createdAt = new Date();

      typeOrmRepository.findOne.mockResolvedValue(exportEntity);

      const result = await repository.findById('export-123');

      expect(result).toEqual(exportEntity);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'export-123' },
      });
    });

    it('should return null when export request not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all export requests for a user', async () => {
      const exports = [
        Object.assign(new RgpdExportEntity(), {
          id: 'export-1',
          userId: 'user-123',
          status: 'completed',
          format: 'json',
          requestedBy: 'user',
          createdAt: new Date('2024-01-02'),
        }),
        Object.assign(new RgpdExportEntity(), {
          id: 'export-2',
          userId: 'user-123',
          status: 'pending',
          format: 'csv',
          requestedBy: 'user',
          createdAt: new Date('2024-01-01'),
        }),
      ];

      typeOrmRepository.find.mockResolvedValue(exports);

      const result = await repository.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when user has no exports', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findByUserId('user-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new export request with all fields', async () => {
      const exportData = {
        userId: 'user-123',
        status: 'pending' as const,
        format: 'json' as const,
        requestedBy: 'user' as const,
        ipAddress: '192.168.1.1',
      };

      const createdEntity = new RgpdExportEntity();
      Object.assign(createdEntity, {
        ...exportData,
        id: 'export-123',
        createdAt: new Date(),
      });

      typeOrmRepository.create.mockReturnValue(createdEntity as any);
      typeOrmRepository.save.mockResolvedValue(createdEntity);

      const result = await repository.create(exportData);

      expect(result).toEqual(createdEntity);
      expect(typeOrmRepository.create).toHaveBeenCalledWith(exportData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdEntity);
    });

    it('should create an export request with different status', async () => {
      const exportData = {
        userId: 'user-456',
        status: 'processing' as const,
        format: 'csv' as const,
        requestedBy: 'admin' as const,
        ipAddress: '10.0.0.1',
      };

      const createdEntity = new RgpdExportEntity();
      Object.assign(createdEntity, {
        ...exportData,
        id: 'export-456',
        createdAt: new Date(),
      });

      typeOrmRepository.create.mockReturnValue(createdEntity as any);
      typeOrmRepository.save.mockResolvedValue(createdEntity);

      const result = await repository.create(exportData);

      expect(result.status).toBe('processing');
      expect(result.format).toBe('csv');
      expect(result.requestedBy).toBe('admin');
    });

    it('should create an automated export request', async () => {
      const exportData = {
        userId: 'user-789',
        status: 'pending' as const,
        format: 'json' as const,
        requestedBy: 'automated' as const,
        ipAddress: '127.0.0.1',
      };

      const createdEntity = new RgpdExportEntity();
      Object.assign(createdEntity, {
        ...exportData,
        id: 'export-789',
        createdAt: new Date(),
      });

      typeOrmRepository.create.mockReturnValue(createdEntity as any);
      typeOrmRepository.save.mockResolvedValue(createdEntity);

      const result = await repository.create(exportData);

      expect(result.requestedBy).toBe('automated');
    });
  });

  describe('update', () => {
    it('should update an export request and return the updated entity', async () => {
      const updateData = {
        status: 'completed' as const,
        fileR2Key: 'exports/user-123/export-123.json',
        fileSize: 1024,
        signedUrl: 'https://example.com/download/token',
        expiresAt: new Date('2024-12-31'),
        completedAt: new Date(),
      };

      const updatedEntity = new RgpdExportEntity();
      Object.assign(updatedEntity, {
        id: 'export-123',
        userId: 'user-123',
        format: 'json',
        requestedBy: 'user',
        ...updateData,
        createdAt: new Date(),
      });

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await repository.update('export-123', updateData);

      expect(result).toEqual(updatedEntity);
      expect(typeOrmRepository.update).toHaveBeenCalledWith({ id: 'export-123' }, updateData);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'export-123' } });
    });

    it('should update status to failed with error message', async () => {
      const updateData = {
        status: 'failed' as const,
        errorMessage: 'Failed to generate export file',
      };

      const updatedEntity = new RgpdExportEntity();
      Object.assign(updatedEntity, {
        id: 'export-456',
        userId: 'user-456',
        status: 'failed',
        format: 'csv',
        requestedBy: 'user',
        errorMessage: 'Failed to generate export file',
        createdAt: new Date(),
      });

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await repository.update('export-456', updateData);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Failed to generate export file');
    });

    it('should update status to expired', async () => {
      const updateData = {
        status: 'expired' as const,
      };

      const updatedEntity = new RgpdExportEntity();
      Object.assign(updatedEntity, {
        id: 'export-789',
        userId: 'user-789',
        status: 'expired',
        format: 'json',
        requestedBy: 'user',
        createdAt: new Date(),
      });

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await repository.update('export-789', updateData);

      expect(result.status).toBe('expired');
    });

    it('should throw error when export not found after update', async () => {
      const updateData = {
        status: 'completed' as const,
      };

      typeOrmRepository.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('non-existent', updateData)).rejects.toThrow(
        'Export with id non-existent not found after update'
      );
    });

    it('should update only specific fields', async () => {
      const updateData = {
        fileSize: 2048,
      };

      const updatedEntity = new RgpdExportEntity();
      Object.assign(updatedEntity, {
        id: 'export-123',
        userId: 'user-123',
        status: 'processing',
        format: 'json',
        requestedBy: 'user',
        fileSize: 2048,
        createdAt: new Date(),
      });

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await repository.update('export-123', updateData);

      expect(result.fileSize).toBe(2048);
      expect(typeOrmRepository.update).toHaveBeenCalledWith({ id: 'export-123' }, updateData);
    });
  });

  describe('createRequest', () => {
    it('should create a JSON export request with default values', async () => {
      const createdEntity = new RgpdExportEntity();
      Object.assign(createdEntity, {
        id: 'export-123',
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        requestedBy: 'user',
        createdAt: new Date(),
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      typeOrmRepository.create.mockReturnValue(createdEntity as any);
      typeOrmRepository.save.mockResolvedValue(createdEntity);

      const result = await repository.createRequest('user-123', 'json');

      expect(result).toEqual(createdEntity);
      expect(consoleSpy).toHaveBeenCalledWith('[RGPD] createRequest called with userId =', 'user-123');
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        requestedBy: 'user',
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdEntity);

      consoleSpy.mockRestore();
    });

    it('should create a CSV export request with default values', async () => {
      const createdEntity = new RgpdExportEntity();
      Object.assign(createdEntity, {
        id: 'export-456',
        userId: 'user-456',
        format: 'csv',
        status: 'pending',
        requestedBy: 'user',
        createdAt: new Date(),
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      typeOrmRepository.create.mockReturnValue(createdEntity as any);
      typeOrmRepository.save.mockResolvedValue(createdEntity);

      const result = await repository.createRequest('user-456', 'csv');

      expect(result.format).toBe('csv');
      expect(result.status).toBe('pending');
      expect(result.requestedBy).toBe('user');
      expect(consoleSpy).toHaveBeenCalledWith('[RGPD] createRequest called with userId =', 'user-456');

      consoleSpy.mockRestore();
    });
  });
});
