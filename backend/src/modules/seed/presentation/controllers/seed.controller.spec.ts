import { Test, TestingModule } from '@nestjs/testing';
import { SeedController } from './seed.controller';
import { SeedService } from '../../application/services/seed.service';

describe('SeedController', () => {
  let controller: SeedController;
  let seedService: jest.Mocked<SeedService>;

  const mockSeedResult = {
    message: 'Database seeding completed successfully',
    details: {
      roles: ['user_freemium', 'user_premium', 'user_admin'],
      contracts: ['netflix', 'spotify', 'amazon_prime', 'disney_plus', 'apple_music'],
      users: [
        'sophie.martin@example.com',
        'pierre.dubois@example.com',
        'marie.lambert@example.com',
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        {
          provide: SeedService,
          useValue: {
            seedAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeedController>(SeedController);
    seedService = module.get(SeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seed', () => {
    it('should call seedService.seedAll and return result', async () => {
      seedService.seedAll.mockResolvedValue(mockSeedResult);

      const result = await controller.seed();

      expect(result).toEqual(mockSeedResult);
      expect(seedService.seedAll).toHaveBeenCalledTimes(1);
    });

    it('should return correct message', async () => {
      seedService.seedAll.mockResolvedValue(mockSeedResult);

      const result = await controller.seed();

      expect(result.message).toBe('Database seeding completed successfully');
    });

    it('should return roles in details', async () => {
      seedService.seedAll.mockResolvedValue(mockSeedResult);

      const result = await controller.seed();

      expect(result.details.roles).toEqual(['user_freemium', 'user_premium', 'user_admin']);
    });

    it('should return contracts in details', async () => {
      seedService.seedAll.mockResolvedValue(mockSeedResult);

      const result = await controller.seed();

      expect(result.details.contracts).toEqual([
        'netflix',
        'spotify',
        'amazon_prime',
        'disney_plus',
        'apple_music',
      ]);
    });

    it('should return users in details', async () => {
      seedService.seedAll.mockResolvedValue(mockSeedResult);

      const result = await controller.seed();

      expect(result.details.users).toEqual([
        'sophie.martin@example.com',
        'pierre.dubois@example.com',
        'marie.lambert@example.com',
      ]);
    });

    it('should handle empty seeding (all data exists)', async () => {
      const emptyResult = {
        message: 'Database seeding completed successfully',
        details: {
          roles: [],
          contracts: [],
          users: [],
        },
      };
      seedService.seedAll.mockResolvedValue(emptyResult);

      const result = await controller.seed();

      expect(result.details.roles).toHaveLength(0);
      expect(result.details.contracts).toHaveLength(0);
      expect(result.details.users).toHaveLength(0);
    });

    it('should propagate errors from seedService', async () => {
      const error = new Error('Database connection failed');
      seedService.seedAll.mockRejectedValue(error);

      await expect(controller.seed()).rejects.toThrow('Database connection failed');
      expect(seedService.seedAll).toHaveBeenCalledTimes(1);
    });
  });
});
