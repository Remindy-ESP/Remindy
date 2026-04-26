import { Test, TestingModule } from '@nestjs/testing';
import { FindSubscriptionsByPeriodUseCase } from './find-subscriptions-by-period.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { BadRequestException } from '@nestjs/common';

describe('FindSubscriptionsByPeriodUseCase', () => {
  let useCase: FindSubscriptionsByPeriodUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findByFrequency: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSubscriptionsByPeriodUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindSubscriptionsByPeriodUseCase>(FindSubscriptionsByPeriodUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find subscriptions by frequency successfully', async () => {
    const frequency = 'monthly';

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: 'user-123',
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
        userId: 'user-123',
        name: 'Spotify',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-03-01'),
        nextDueDate: new Date('2025-04-01'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findByFrequency.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(frequency);

    expect(result).toBe(expectedSubscriptions);
    expect(result).toHaveLength(2);
    expect(repository.findByFrequency).toHaveBeenCalledWith(frequency);
    expect(repository.findByFrequency).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no subscriptions found for frequency', async () => {
    const frequency = 'weekly';

    repository.findByFrequency.mockResolvedValue([]);

    const result = await useCase.execute(frequency);

    expect(result).toEqual([]);
    expect(repository.findByFrequency).toHaveBeenCalledWith(frequency);
  });

  it('should throw BadRequestException for invalid frequency', async () => {
    const invalidFrequency = 'invalid';

    await expect(useCase.execute(invalidFrequency)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(invalidFrequency)).rejects.toThrow(
      'Invalid frequency. Must be one of: one-time, weekly, monthly, quarterly, yearly',
    );
    expect(repository.findByFrequency).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const frequency = 'monthly';
    const error = new Error('Database error');

    repository.findByFrequency.mockRejectedValue(error);

    await expect(useCase.execute(frequency)).rejects.toThrow('Database error');
  });

  it('should find yearly subscriptions', async () => {
    const frequency = 'yearly';

    const expectedSubscriptions = [
      new Subscription({
        id: 'sub-1',
        userId: 'user-123',
        name: 'Annual Service',
        amount: 99.99,
        currency: 'EUR',
        frequency: 'yearly',
        startDate: new Date('2024-12-15'),
        nextDueDate: new Date('2025-12-15'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    repository.findByFrequency.mockResolvedValue(expectedSubscriptions);

    const result = await useCase.execute(frequency);

    expect(result).toBe(expectedSubscriptions);
    expect(repository.findByFrequency).toHaveBeenCalledWith(frequency);
  });
});
