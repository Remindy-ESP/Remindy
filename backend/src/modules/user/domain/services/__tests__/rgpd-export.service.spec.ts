import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RgpdExportService } from '../rgpd-export.service';
import { RgpdExportRepository } from '../../../infrastructure/repositories/rgpd-export.repository';
import { UserTypeOrmRepository } from '../../../infrastructure/repositories/user-typeorm.repository';
const TEST_IP = 'test-ip-address' 
describe('user/domain/services/RgpdExportService', () => {
  let service: RgpdExportService;
  let rgpdExportRepository: jest.Mocked<RgpdExportRepository>;
  let userRepository: jest.Mocked<UserTypeOrmRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'john@example.com',
  } as any;

  const mockExport = {
    id: 'export-123',
    userId: 'user-123',
    status: 'pending',
    format: 'json',
    requestedBy: 'user',
    ipAddress: '127.0.0.1',
    fileR2Key: null,
    fileSize: null,
    signedUrl: null,
    expiresAt: null,
    errorMessage: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    completedAt: null,
  } as any;

  beforeEach(() => {
    rgpdExportRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    userRepository = {
      findById: jest.fn(),
    } as any;

    service = new RgpdExportService(rgpdExportRepository, userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExportRequest', () => {
    it('creates a json export by default', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(mockExport);

      const result = await service.createExportRequest('user-123', {}, TEST_IP);

      expect(rgpdExportRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        status: 'pending',
        format: 'json',
        requestedBy: 'user',
        ipAddress: TEST_IP,
      });

      expect(result).toEqual({
        id: 'export-123',
        userId: 'user-123',
        status: 'pending',
        format: 'json',
        fileR2Key: null,
        fileSize: null,
        signedUrl: null,
        expiresAt: null,
        errorMessage: null,
        requestedBy: 'user',
        createdAt: mockExport.createdAt,
        completedAt: null,
      });
    });

    it('accepts csv format', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue({
        ...mockExport,
        format: 'csv',
      });

      await service.createExportRequest('user-123', { format: 'csv' }, TEST_IP);

      expect(rgpdExportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'csv' }),
      );
    });

    it('throws when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.createExportRequest('missing-user', { format: 'json' }, TEST_IP),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('throws when format is invalid', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([]);

      await expect(
        service.createExportRequest('user-123', { format: 'xml' as any }, TEST_IP),
      ).rejects.toThrow(new BadRequestException('Invalid format. Must be json or csv'));
    });

    it('throws when a pending export already exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([{ ...mockExport, status: 'pending' }]);

      await expect(
        service.createExportRequest('user-123', { format: 'json' }, TEST_IP),
      ).rejects.toThrow(new BadRequestException('You already have a pending export request'));
    });

    it('throws when a processing export already exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([
        { ...mockExport, status: 'processing' },
      ]);

      await expect(
        service.createExportRequest('user-123', { format: 'json' }, TEST_IP),
      ).rejects.toThrow(new BadRequestException('You already have a pending export request'));
    });
  });

  describe('getExportStatus', () => {
    it('returns the export when it belongs to the user', async () => {
      rgpdExportRepository.findById.mockResolvedValue(mockExport);

      await expect(service.getExportStatus('user-123', 'export-123')).resolves.toEqual({
        id: 'export-123',
        userId: 'user-123',
        status: 'pending',
        format: 'json',
        fileR2Key: null,
        fileSize: null,
        signedUrl: null,
        expiresAt: null,
        errorMessage: null,
        requestedBy: 'user',
        createdAt: mockExport.createdAt,
        completedAt: null,
      });
    });

    it('throws when export does not exist', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.getExportStatus('user-123', 'missing')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });

    it('throws when export belongs to another user', async () => {
      rgpdExportRepository.findById.mockResolvedValue({
        ...mockExport,
        userId: 'other-user',
      });

      await expect(service.getExportStatus('user-123', 'export-123')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });
  });

  describe('getUserExports', () => {
    it('returns mapped exports for the user', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      rgpdExportRepository.findByUserId.mockResolvedValue([
        mockExport,
        { ...mockExport, id: 'export-456', status: 'completed' },
      ]);

      await expect(service.getUserExports('user-123')).resolves.toEqual([
        {
          id: 'export-123',
          userId: 'user-123',
          status: 'pending',
          format: 'json',
          fileR2Key: null,
          fileSize: null,
          signedUrl: null,
          expiresAt: null,
          errorMessage: null,
          requestedBy: 'user',
          createdAt: mockExport.createdAt,
          completedAt: null,
        },
        {
          id: 'export-456',
          userId: 'user-123',
          status: 'completed',
          format: 'json',
          fileR2Key: null,
          fileSize: null,
          signedUrl: null,
          expiresAt: null,
          errorMessage: null,
          requestedBy: 'user',
          createdAt: mockExport.createdAt,
          completedAt: null,
        },
      ]);
    });

    it('throws when user does not exist for getUserExports', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserExports('missing-user')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('processExport', () => {
    it('marks export as processing then completed', async () => {
      rgpdExportRepository.findById.mockResolvedValue(mockExport);
      rgpdExportRepository.update.mockResolvedValue(undefined as any);

      await service.processExport('export-123');

      expect(rgpdExportRepository.update).toHaveBeenNthCalledWith(1, 'export-123', {
        status: 'processing',
      });
      expect(rgpdExportRepository.update).toHaveBeenNthCalledWith(
        2,
        'export-123',
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
        }),
      );
    });

    it('throws when export is missing during processing', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.processExport('missing-export')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });

    it('marks export as failed with the original error message', async () => {
      const error = new Error('processing failed');

      rgpdExportRepository.findById.mockResolvedValue(mockExport);
      rgpdExportRepository.update
        .mockResolvedValueOnce(undefined as any)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined as any);

      await service.processExport('export-123');

      expect(rgpdExportRepository.update).toHaveBeenLastCalledWith('export-123', {
        status: 'failed',
        errorMessage: 'processing failed',
      });
    });
  });
});
