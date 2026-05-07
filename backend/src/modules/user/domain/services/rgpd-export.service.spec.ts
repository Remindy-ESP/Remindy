import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RgpdExportService } from './rgpd-export.service';
import { RgpdExportRepository } from '../../infrastructure/repositories/rgpd-export.repository';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';

describe('RgpdExportService (domain)', () => {
  let service: RgpdExportService;
  let rgpdExportRepository: jest.Mocked<RgpdExportRepository>;
  let userRepository: jest.Mocked<UserTypeOrmRepository>;

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
    fileR2Key: undefined as string | undefined,
    fileSize: undefined as number | undefined,
    signedUrl: undefined as string | undefined,
    expiresAt: undefined as Date | undefined,
    errorMessage: undefined as string | undefined,
    createdAt: new Date('2025-01-01'),
    completedAt: undefined as Date | undefined,
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
          provide: UserTypeOrmRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<RgpdExportService>(RgpdExportService);
    rgpdExportRepository = module.get(RgpdExportRepository);
    userRepository = module.get(UserTypeOrmRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExportRequest', () => {
    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.createExportRequest('nonexistent-id', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createExportRequest('nonexistent-id', { format: 'json' }, '127.0.0.1'),
      ).rejects.toThrow('User not found');
    });

    it('should default format to json when not provided', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(mockExport as any);

      await service.createExportRequest('user-123', {}, '127.0.0.1');

      expect(rgpdExportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'json' }),
      );
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

    it('should create export request successfully with json format', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(mockExport as any);

      const result = await service.createExportRequest(
        'user-123',
        { format: 'json' },
        '192.0.2.1',
      );

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
        ipAddress: '192.0.2.1',
      });
    });

    it('should create export request successfully with csv format', async () => {
      const csvExport = { ...mockExport, format: 'csv' as const };
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(csvExport as any);

      const result = await service.createExportRequest('user-123', { format: 'csv' }, '127.0.0.1');

      expect(result.format).toBe('csv');
      expect(rgpdExportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'csv' }),
      );
    });
  });

  describe('getExportStatus', () => {
    it('should return export status for the owner', async () => {
      rgpdExportRepository.findById.mockResolvedValue(mockExport as any);

      const result = await service.getExportStatus('user-123', 'export-123');

      expect(result.id).toBe('export-123');
      expect(result.userId).toBe('user-123');
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundException when export not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.getExportStatus('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getExportStatus('user-123', 'nonexistent')).rejects.toThrow(
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
      await expect(service.getExportStatus('user-123', 'export-123')).rejects.toThrow(
        'Export request not found',
      );
    });
  });

  describe('getUserExports', () => {
    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserExports('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getUserExports('nonexistent')).rejects.toThrow('User not found');
    });

    it('should return empty array when user has no exports', async () => {
      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getUserExports('user-123');

      expect(result).toEqual([]);
    });

    it('should return all user exports mapped correctly', async () => {
      const mockExports = [
        mockExport,
        { ...mockExport, id: 'export-456', status: 'completed' as const },
      ];

      userRepository.findById.mockResolvedValue(mockUser as any);
      rgpdExportRepository.findByUserId.mockResolvedValue(mockExports as any);

      const result = await service.getUserExports('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
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
      expect(result[1].id).toBe('export-456');
      expect(result[1].status).toBe('completed');
    });
  });

  describe('processExport', () => {
    it('should throw NotFoundException when export not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.processExport('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.processExport('nonexistent')).rejects.toThrow(
        'Export request not found',
      );
    });

    it('should update export to processing then completed', async () => {
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

    it('should update status to failed when an error occurs during processing', async () => {
      const mockError = new Error('Storage failure');

      rgpdExportRepository.findById.mockResolvedValue(mockExport as any);
      rgpdExportRepository.update
        .mockResolvedValueOnce(mockExport as any) // processing
        .mockRejectedValueOnce(mockError) // completed fails
        .mockResolvedValueOnce(mockExport as any); // failed

      await service.processExport('export-123');

      expect(rgpdExportRepository.update).toHaveBeenLastCalledWith(
        'export-123',
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Storage failure',
        }),
      );
    });
  });
});
