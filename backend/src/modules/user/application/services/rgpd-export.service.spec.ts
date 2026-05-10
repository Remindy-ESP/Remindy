import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RgpdExportService } from './rgpd-export.service';

describe('RgpdExportService (application)', () => {
  let service: RgpdExportService;
  let rgpdExportRepository: any;
  let userRepository: any;

  const exportEntity = {
    id: 'export-1',
    userId: 'user-1',
    status: 'pending',
    format: 'json',
    fileR2Key: null,
    fileSize: null,
    signedUrl: null,
    expiresAt: null,
    errorMessage: null,
    requestedBy: 'user',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    completedAt: null,
  };

  beforeEach(() => {
    rgpdExportRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    userRepository = {
      findById: jest.fn(),
    };

    service = new RgpdExportService(rgpdExportRepository, userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExportRequest', () => {
    it('creates an export request with default json format', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue(exportEntity);

      const result = await service.createExportRequest('user-1', {} as any, '127.0.0.1');

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(rgpdExportRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(rgpdExportRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        status: 'pending',
        format: 'json',
        requestedBy: 'user',
        ipAddress: '127.0.0.1',
      });
      expect(result).toEqual(exportEntity);
    });

    it('creates an export request with csv format', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([]);
      rgpdExportRepository.create.mockResolvedValue({
        ...exportEntity,
        format: 'csv',
      });

      const result = await service.createExportRequest(
        'user-1',
        { format: 'csv' } as any,
        '127.0.0.1',
      );

      expect(rgpdExportRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        status: 'pending',
        format: 'csv',
        requestedBy: 'user',
        ipAddress: '127.0.0.1',
      });
      expect(result.format).toBe('csv');
    });

    it('throws when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.createExportRequest('missing-user', {} as any, '127.0.0.1'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('throws when there is already a pending export', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([{ ...exportEntity, status: 'pending' }]);

      await expect(service.createExportRequest('user-1', {} as any, '127.0.0.1')).rejects.toThrow(
        new BadRequestException(
          'You already have a pending export request. Please wait for it to complete.',
        ),
      );
    });

    it('throws when there is already a processing export', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([
        { ...exportEntity, status: 'processing' },
      ]);

      await expect(service.createExportRequest('user-1', {} as any, '127.0.0.1')).rejects.toThrow(
        new BadRequestException(
          'You already have a pending export request. Please wait for it to complete.',
        ),
      );
    });

    it('throws when format is invalid', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([]);

      await expect(
        service.createExportRequest('user-1', { format: 'xml' } as any, '127.0.0.1'),
      ).rejects.toThrow(new BadRequestException('Invalid format. Must be json or csv'));
    });
  });

  describe('getExportStatus', () => {
    it('returns the export when it belongs to the user', async () => {
      rgpdExportRepository.findById.mockResolvedValue(exportEntity);

      await expect(service.getExportStatus('user-1', 'export-1')).resolves.toEqual(exportEntity);
    });

    it('throws when export is not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.getExportStatus('user-1', 'missing')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });

    it('throws when export belongs to another user', async () => {
      rgpdExportRepository.findById.mockResolvedValue({
        ...exportEntity,
        userId: 'other-user',
      });

      await expect(service.getExportStatus('user-1', 'export-1')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });
  });

  describe('getUserExports', () => {
    it('returns mapped exports', async () => {
      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      rgpdExportRepository.findByUserId.mockResolvedValue([
        exportEntity,
        { ...exportEntity, id: 'export-2', status: 'completed' },
      ]);

      await expect(service.getUserExports('user-1')).resolves.toEqual([
        exportEntity,
        { ...exportEntity, id: 'export-2', status: 'completed' },
      ]);
    });

    it('throws when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserExports('missing-user')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('processExport', () => {
    it('marks export as processing then completed', async () => {
      rgpdExportRepository.findById.mockResolvedValue(exportEntity);
      rgpdExportRepository.update.mockResolvedValue(undefined);

      await service.processExport('export-1');

      expect(rgpdExportRepository.update).toHaveBeenNthCalledWith(1, 'export-1', {
        status: 'processing',
      });

      expect(rgpdExportRepository.update).toHaveBeenNthCalledWith(
        2,
        'export-1',
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
        }),
      );
    });

    it('throws when export to process is not found', async () => {
      rgpdExportRepository.findById.mockResolvedValue(null);

      await expect(service.processExport('missing-export')).rejects.toThrow(
        new NotFoundException('Export request not found'),
      );
    });

    it('marks export as failed when processing throws an Error', async () => {
      rgpdExportRepository.findById.mockResolvedValue(exportEntity);
      rgpdExportRepository.update
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(undefined);

      await service.processExport('export-1');

      expect(rgpdExportRepository.update).toHaveBeenLastCalledWith('export-1', {
        status: 'failed',
        errorMessage: 'boom',
      });
    });

    it('marks export as failed with fallback message for non-Error values', async () => {
      rgpdExportRepository.findById.mockResolvedValue(exportEntity);
      rgpdExportRepository.update
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce('boom')
        .mockResolvedValueOnce(undefined);

      await service.processExport('export-1');

      expect(rgpdExportRepository.update).toHaveBeenLastCalledWith('export-1', {
        status: 'failed',
        errorMessage: 'Unknown error occurred',
      });
    });
  });
});
