import { Test, TestingModule } from '@nestjs/testing';
import { RequestRgpdExportUseCase } from './request-rgpd-export.use-case';
import { RgpdExportRepository } from '../../infrastructure/repositories/rgpd-export.repository';
import { RequestRgpdExportDto } from '../dto/request-export-rgpd.dto';

describe('RequestRgpdExportUseCase', () => {
  let useCase: RequestRgpdExportUseCase;
  let rgpdExportRepo: jest.Mocked<RgpdExportRepository>;

  beforeEach(async () => {
    const mockRgpdExportRepo = {
      createRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestRgpdExportUseCase,
        {
          provide: RgpdExportRepository,
          useValue: mockRgpdExportRepo,
        },
      ],
    }).compile();

    useCase = module.get<RequestRgpdExportUseCase>(RequestRgpdExportUseCase);
    rgpdExportRepo = module.get(RgpdExportRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create RGPD export request with specified format', async () => {
      const userId = 'user-123';
      const dto: RequestRgpdExportDto = { format: 'json' };
      const mockRequest = { id: 'export-123', userId, format: 'json' };

      rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

      const result = await useCase.execute(userId, dto);

      expect(result).toBe(mockRequest);
      expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'json');
    });

    it('should use json as default format when not specified', async () => {
      const userId = 'user-456';
      const dto: RequestRgpdExportDto = {};
      const mockRequest = { id: 'export-456', userId, format: 'json' };

      rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

      const result = await useCase.execute(userId, dto);

      expect(result).toBe(mockRequest);
      expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'json');
    });

    it('should handle csv format', async () => {
      const userId = 'user-789';
      const dto: RequestRgpdExportDto = { format: 'csv' };
      const mockRequest = { id: 'export-789', userId, format: 'csv' };

      rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

      const result = await useCase.execute(userId, dto);

      expect(result).toBe(mockRequest);
      expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'csv');
    });

    it('should handle different user ids', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const dto: RequestRgpdExportDto = { format: 'json' };

      for (const userId of userIds) {
        const mockRequest = { id: `export-${userId}`, userId, format: 'json' };
        rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

        await useCase.execute(userId, dto);

        expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'json');
      }

      expect(rgpdExportRepo.createRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle null format by using default', async () => {
      const userId = 'user-null';
      const dto: RequestRgpdExportDto = { format: null as any };
      const mockRequest = { id: 'export-null', userId, format: 'json' };

      rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

      const result = await useCase.execute(userId, dto);

      expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'json');
    });

    it('should handle undefined format by using default', async () => {
      const userId = 'user-undefined';
      const dto: RequestRgpdExportDto = { format: undefined };
      const mockRequest = { id: 'export-undefined', userId, format: 'json' };

      rgpdExportRepo.createRequest.mockResolvedValue(mockRequest as any);

      const result = await useCase.execute(userId, dto);

      expect(rgpdExportRepo.createRequest).toHaveBeenCalledWith(userId, 'json');
    });
  });
});
