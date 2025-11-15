import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSubscriptionUseCase } from './delete-subscription.use-case';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('DeleteSubscriptionUseCase', () => {
  let useCase: DeleteSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      softDelete: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteSubscriptionUseCase>(DeleteSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should soft delete a subscription successfully', async () => {
    const subscriptionId = 'subscription-123';

    const existingSubscription = new Subscription({
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

    repository.findById.mockResolvedValue(existingSubscription);
    repository.softDelete.mockResolvedValue(true);

    await useCase.execute(subscriptionId);

    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(repository.softDelete).toHaveBeenCalledWith(subscriptionId);
    expect(repository.softDelete).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when subscription does not exist', async () => {
    const subscriptionId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Subscription with id ${subscriptionId} not found`,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should hard delete a subscription when softDelete is false', async () => {
    const subscriptionId = 'subscription-123';

    const existingSubscription = new Subscription({
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

    repository.findById.mockResolvedValue(existingSubscription);
    repository.delete.mockResolvedValue(true);

    await useCase.execute(subscriptionId, false);

    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(repository.delete).toHaveBeenCalledWith(subscriptionId);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const subscriptionId = 'subscription-123';
    const error = new Error('Database error');

    repository.findById.mockRejectedValue(error);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow('Database error');
  });

  it('should throw NotFoundException when soft delete fails', async () => {
    const subscriptionId = 'subscription-123';

    const existingSubscription = new Subscription({
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

    repository.findById.mockResolvedValue(existingSubscription);
    repository.softDelete.mockResolvedValue(false);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Failed to delete subscription with id ${subscriptionId}`,
    );
  });
});
