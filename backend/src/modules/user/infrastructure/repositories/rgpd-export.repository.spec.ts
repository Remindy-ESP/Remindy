import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RgpdExportRepository } from './rgpd-export.repository';
import { RgpdExportEntity } from '../../../../infrastructure/database/entities/rgpd-export.entity';

describe('RgpdExportRepository', () => {
  let repository: RgpdExportRepository;
  let typeOrmRepository: jest.Mocked<Repository<RgpdExportEntity>>;

  const mockExport: Partial<RgpdExportEntity> = {
    id: 'export-123',
    userId: 'user-123',
    status: 'pending',
    format: 'json',
    requestedBy: 'user',
    ipAddress: '127.0.0.1',
    createdAt: new Date('2025-01-01'),
  };

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find an export by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockExport as RgpdExportEntity);

      const result = await repository.findById('export-123');

      expect(result).toBe(mockExport);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'export-123' } });
    });

    it('should return null when export not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find exports by user id ordered by createdAt DESC', async () => {
      const exports = [mockExport, { ...mockExport, id: 'export-456' }];
      typeOrmRepository.find.mockResolvedValue(exports as RgpdExportEntity[]);

      const result = await repository.findByUserId('user-123');

      expect(result).toBe(exports);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no exports found', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findByUserId('user-999');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create an export request', async () => {
      const createData = {
        userId: 'user-123',
        status: 'pending' as const,
        format: 'json' as const,
        requestedBy: 'user' as const,
        ipAddress: '192.168.1.1',
      };

      typeOrmRepository.create.mockReturnValue(mockExport as RgpdExportEntity);
      typeOrmRepository.save.mockResolvedValue(mockExport as RgpdExportEntity);

      const result = await repository.create(createData);

      expect(result).toBe(mockExport);
      expect(typeOrmRepository.create).toHaveBeenCalledWith(createData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockExport);
    });

    it('should create a csv export request', async () => {
      const createData = {
        userId: 'user-123',
        status: 'pending' as const,
        format: 'csv' as const,
        requestedBy: 'admin' as const,
        ipAddress: '10.0.0.1',
      };

      const csvExport = { ...mockExport, format: 'csv', requestedBy: 'admin' };
      typeOrmRepository.create.mockReturnValue(csvExport as RgpdExportEntity);
      typeOrmRepository.save.mockResolvedValue(csvExport as RgpdExportEntity);

      const result = await repository.create(createData);

      expect(result).toBe(csvExport);
    });
  });

  describe('update', () => {
    it('should update an export and return the updated entity', async () => {
      const updateData = { status: 'completed' as const, completedAt: new Date() };
      const updatedExport = { ...mockExport, ...updateData };

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedExport as RgpdExportEntity);

      const result = await repository.update('export-123', updateData);

      expect(result).toBe(updatedExport);
      expect(typeOrmRepository.update).toHaveBeenCalledWith({ id: 'export-123' }, updateData);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'export-123' } });
    });

    it('should update status to processing', async () => {
      const updateData = { status: 'processing' as const };
      const updatedExport = { ...mockExport, status: 'processing' };

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedExport as RgpdExportEntity);

      const result = await repository.update('export-123', updateData);

      expect(result.status).toBe('processing');
    });

    it('should update status to failed with error message', async () => {
      const updateData = { status: 'failed' as const, errorMessage: 'Something went wrong' };
      const updatedExport = { ...mockExport, ...updateData };

      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedExport as RgpdExportEntity);

      const result = await repository.update('export-123', updateData);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Something went wrong');
    });

    it('should throw error when export not found after update', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.update('nonexistent-id', { status: 'completed' as const }),
      ).rejects.toThrow('Export with id nonexistent-id not found after update');
    });

    it('should update with all partial fields', async () => {
      const updateData = {
        status: 'completed' as const,
        fileR2Key: 'exports/user-123/file.json',
        fileSize: 1024,
        signedUrl: 'https://cdn.example.com/file.json',
        expiresAt: new Date('2026-01-01'),
        completedAt: new Date(),
      };

      const updatedExport = { ...mockExport, ...updateData };
      typeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      typeOrmRepository.findOne.mockResolvedValue(updatedExport as RgpdExportEntity);

      const result = await repository.update('export-123', updateData);

      expect(result).toBe(updatedExport);
    });
  });

  describe('createRequest', () => {
    it('should create a basic export request with default values', async () => {
      const exportEntity = { ...mockExport };
      typeOrmRepository.create.mockReturnValue(exportEntity as RgpdExportEntity);
      typeOrmRepository.save.mockResolvedValue(exportEntity as RgpdExportEntity);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await repository.createRequest('user-123', 'json');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[RGPD] createRequest called with userId =',
        'user-123',
      );
      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        requestedBy: 'user',
      });
      expect(result).toBe(exportEntity);

      consoleSpy.mockRestore();
    });

    it('should create a csv export request', async () => {
      const csvExport = { ...mockExport, format: 'csv' };
      typeOrmRepository.create.mockReturnValue(csvExport as RgpdExportEntity);
      typeOrmRepository.save.mockResolvedValue(csvExport as RgpdExportEntity);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await repository.createRequest('user-456', 'csv');

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        userId: 'user-456',
        format: 'csv',
        status: 'pending',
        requestedBy: 'user',
      });
      expect(result).toBe(csvExport);

      consoleSpy.mockRestore();
    });
  });
});
