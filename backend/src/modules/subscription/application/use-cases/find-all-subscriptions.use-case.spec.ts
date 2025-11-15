import { Test, TestingModule } from '@nestjs/testing';
import { FindAllSubscriptionsUseCase } from './find-all-subscriptions.use-case';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { FindAllSubscriptionsAppDto } from '../dto/find-all-subscriptions-app.dto';

describe('FindAllSubscriptionsUseCase', () => {
  let useCase: FindAllSubscriptionsUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllSubscriptionsUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllSubscriptionsUseCase>(FindAllSubscriptionsUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all subscriptions for a user', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-123',
    };

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: dto.userId,
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Subscription({
        id: 'sub-2',
        userId: dto.userId,
        name: 'Spotify',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedSubscriptions);
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith(dto);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should find subscriptions with status filter', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-123',
      status: 'active',
    };

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: dto.userId,
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedSubscriptions);
    expect(result.every((sub) => sub.status === 'active')).toBe(true);
    expect(repository.findAll).toHaveBeenCalledWith(dto);
  });

  it('should find subscriptions with frequency filter', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-123',
      frequency: 'yearly',
    };

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: dto.userId,
        name: 'Adobe Creative Cloud',
        amount: 599.99,
        currency: 'EUR',
        frequency: 'yearly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2026-01-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedSubscriptions);
    expect(result.every((sub) => sub.frequency === 'yearly')).toBe(true);
    expect(repository.findAll).toHaveBeenCalledWith(dto);
  });

  it('should return empty array when no subscriptions found', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-with-no-subscriptions',
    };

    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(dto);

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(dto);
  });

  it('should find subscriptions with multiple filters', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-123',
      status: 'active',
      frequency: 'monthly',
    };

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: dto.userId,
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findAll.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedSubscriptions);
    expect(repository.findAll).toHaveBeenCalledWith(dto);
  });

  it('should handle repository errors', async () => {
    const dto: FindAllSubscriptionsAppDto = {
      userId: 'user-123',
    };

    const error = new Error('Database error');
    repository.findAll.mockRejectedValue(error);

    await expect(useCase.execute(dto)).rejects.toThrow('Database error');
  });
});
