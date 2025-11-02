import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindSubscriptionUseCase } from './find-subscription.use-case';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';

describe('FindSubscriptionUseCase', () => {
  let useCase: FindSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindSubscriptionUseCase>(FindSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find a subscription by id successfully', async () => {
    const subscriptionId = 'subscription-123';
    const expectedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Netflix Premium',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    });

    repository.findById.mockResolvedValue(expectedSubscription);

    const result = await useCase.findById(subscriptionId);

    expect(result).toBe(expectedSubscription);
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
  });

  it('should throw NotFoundException when subscription does not exist', async () => {
    const subscriptionId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.findById(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.findById(subscriptionId)).rejects.toThrow(
      `Subscription with id ${subscriptionId} not found`,
    );
  });
});
