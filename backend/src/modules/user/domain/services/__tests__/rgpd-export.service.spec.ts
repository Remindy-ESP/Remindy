import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RgpdExportService } from '../rgpd-export.service';
import { RgpdExportRepository } from '../../../infrastructure/repositories/rgpd-export.repository';
import { UserRepository } from '../../../infrastructure/repositories/user-typeorm.repository ';
const TEST_IP_ADDRESS = '192.0.2.1';
describe('RgpdExportService', () => {
  let service: RgpdExportService;
  let rgpdExportRepository: jest.Mocked<RgpdExportRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockExport = {
    id: 'export-123',
    userId: 'user-123',
    status: 'pending' as const,
    format: 'json' as const,
    requestedBy: 'user' as const,
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRgpdExportRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RgpdExportService,
        {
          provide: RgpdExportRepository,
          useValue: mockRgpdExportRepo,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<RgpdExportService>(RgpdExportService);
    rgpdExportRepository = module.get(RgpdExportRepository);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExportRequest', () => {
    it('should create export request successfully', async () => {
      const createDto = { format: 'json' };
      const ipAddress = TEST_IP_ADDRESS;

      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(mockExport as any);

      const result = await service.createExportRequest('user-123', createDto, ipAddress);

      expect(result).toEqual({
        id: mockExport.id,
        userId: mockExport.userId,
        status: mockExport.status,
        format: mockExport.format,
        fileR2Key: undefined,
        fileSize: undefined,
        signedUrl: undefined,
        expiresAt: undefined,
        errorMessage: undefined,
        requestedBy: mockExport.requestedBy,
        createdAt: mockExport.createdAt,
        completedAt: undefined,
      });
      expect(rgpdExportRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        status: 'pending',
        format: 'json',
        requestedBy: 'user',
        ipAddress,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.createExportRequest('nonexistent-id', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when pending export exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([
        { ...mockExport, status: 'pending' },
      ] as any);

      await expect(
        service.createExportRequest('user-123', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createExportRequest('user-123', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow('You already have a pending export request');
    });

    it('should throw BadRequestException when processing export exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([
        { ...mockExport, status: 'processing' },
      ] as any);

      await expect(
        service.createExportRequest('user-123', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid format', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);

      await expect(
        service.createExportRequest('user-123', { format: 'xml' as any }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createExportRequest('user-123', { format: 'xml' as any }, '127.0.0.1'),
      ).rejects.toThrow('Invalid format. Must be json or csv');
    });

    it('should default to json format when not specified', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(mockExport as any);

      await service.createExportRequest('user-123', {}, '127.0.0.1');

      expect(rgpdExportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'json',
        }),
      );
    });

    it('should accept csv format', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue({
        ...mockExport,
        format: 'csv',
      } as any);

      await service.createExportRequest('user-123', { format: 'csv' }, '127.0.0.1');

      expect(rgpdExportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'csv',
        }),
      );
    });
  });

  describe('getExportStatus', () => {
    it('should return export status successfully', async () => {
      rgpdExportRepository.findById.mockResolvedValue(mockExport as any);

      const result = await service.getExportStatus('user-123', 'export-123');

      expect(result.id).toBe('export-123');
      expect(result.userId).toBe('user-123');
      expect(result.status).toBe('pending');
      expect(rgpdExportRepository.findById).toHaveBeenCalledWith('export-123');
    });

    it('should throw NotFoundException when export not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.getExportStatus('user-123', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getExportStatus('user-123', 'nonexistent-id')).rejects.toThrow(
        'Export request not found',
      );
    });

    it('should throw NotFoundException when export belongs to another user', async () => {
      rgpdExportRepository.findById.mockResolvedValue({
        ...mockExport,
        userId: 'other-user',
      } as any);

      await expect(service.getExportStatus('user-123', 'export-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserExports', () => {
    it('should return all user exports', async () => {
      const mockExports = [mockExport, { ...mockExport, id: 'export-456', status: 'completed' }];

      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue(mockExports as any);

      const result = await service.getUserExports('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('export-123');
      expect(result[1].id).toBe('export-456');
      expect(rgpdExportRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserExports('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when user has no exports', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getUserExports('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('processExport', () => {
    it('should update status to processing and then completed', async () => {
      rgpdExportRepository.findById.mockResolvedValue(mockExport as any);
      rgpdExportRepository.update.mockResolvedValue(mockExport as any);

      await service.processExport('export-123');

      expect(rgpdExportRepository.update).toHaveBeenCalledWith('export-123', {
        status: 'processing',
      });
      expect(rgpdExportRepository.update).toHaveBeenCalledWith(
        'export-123',
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when export not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.processExport('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should update status to failed on error', async () => {
      const mockError = new Error('Processing failed');

      rgpdExportRepository.findById.mockResolvedValue(mockExport as any);
      rgpdExportRepository.update
        .mockResolvedValueOnce(mockExport as any)
        .mockRejectedValueOnce(mockError);

      await service.processExport('export-123');

      expect(rgpdExportRepository.update).toHaveBeenCalledWith(
        'export-123',
        expect.objectContaining({
          status: 'failed',
          errorMessage: mockError.message,
        }),
      );
    });
  });
});
