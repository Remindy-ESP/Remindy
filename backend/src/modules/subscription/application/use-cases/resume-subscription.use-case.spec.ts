import { Test, TestingModule } from '@nestjs/testing';
import { ResumeSubscriptionUseCase } from './resume-subscription.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('ResumeSubscriptionUseCase', () => {
  let useCase: ResumeSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ResumeSubscriptionUseCase>(ResumeSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should resume a paused subscription successfully', async () => {
    const subscriptionId = 'subscription-123';

    const pausedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Netflix',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'paused',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const activeSubscription = new Subscription({
      id: subscriptionId,
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
    });

    repository.findById.mockResolvedValue(pausedSubscription);
    repository.update.mockResolvedValue(activeSubscription);

    const result = await useCase.execute(subscriptionId);

    expect(result.status).toBe('active');
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(repository.update).toHaveBeenCalledWith(subscriptionId, expect.any(Subscription));
  });

  it('should throw NotFoundException when subscription does not exist', async () => {
    const subscriptionId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Subscription with id ${subscriptionId} not found`,
    );
  });

  it('should resume a subscription even if already active', async () => {
    const subscriptionId = 'subscription-123';

    const activeSubscription = new Subscription({
      id: subscriptionId,
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
    });

    repository.findById.mockResolvedValue(activeSubscription);
    repository.update.mockResolvedValue(activeSubscription);

    const result = await useCase.execute(subscriptionId);

    expect(result.status).toBe('active');
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
  });

  it('should resume cancelled subscription', async () => {
    const subscriptionId = 'subscription-123';

    const cancelledSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Netflix',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'cancelled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const activeSubscription = new Subscription({
      id: subscriptionId,
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
    });

    repository.findById.mockResolvedValue(cancelledSubscription);
    repository.update.mockResolvedValue(activeSubscription);

    const result = await useCase.execute(subscriptionId);

    expect(result.status).toBe('active');
  });

  it('should throw NotFoundException when update returns null', async () => {
    const subscriptionId = 'subscription-123';

    const pausedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Netflix',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'paused',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(pausedSubscription);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Failed to update subscription with id ${subscriptionId}`,
    );
  });

  it('should handle repository errors', async () => {
    const subscriptionId = 'subscription-123';
    const error = new Error('Database error');

    repository.findById.mockRejectedValue(error);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow('Database error');
  });
});
