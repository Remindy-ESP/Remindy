import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateSubscriptionUseCase } from './update-subscription.use-case';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { UpdateSubscriptionAppDto } from '../dto/update-subscription-app.dto';

describe('UpdateSubscriptionUseCase', () => {
  let useCase: UpdateSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateSubscriptionUseCase>(UpdateSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update a subscription successfully', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Netflix Premium',
      amount: 15.99,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      isActive: true,
    });

    const updateDto: UpdateSubscriptionAppDto = {
      name: 'Netflix Premium HD',
      amount: 17.99,
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    const result = await useCase.execute(subscriptionId, updateDto);

    expect(result).toBeDefined();
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(repository.update).toHaveBeenCalledWith(subscriptionId, expect.any(Subscription));
  });

  it('should throw NotFoundException when subscription does not exist', async () => {
    const subscriptionId = 'non-existent-id';
    const updateDto: UpdateSubscriptionAppDto = {
      name: 'Updated Name',
    };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId, updateDto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId, updateDto)).rejects.toThrow(
      `Subscription with id ${subscriptionId} not found`,
    );
  });

  it('should activate subscription when isActive is true', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date(),
      isActive: false,
    });

    const updateDto: UpdateSubscriptionAppDto = {
      isActive: true,
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.isActive).toBe(true);
  });

  it('should deactivate subscription when isActive is false', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date(),
      isActive: true,
    });

    const updateDto: UpdateSubscriptionAppDto = {
      isActive: false,
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.isActive).toBe(false);
  });

  it('should throw error when update fails', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date(),
      isActive: true,
    });

    const updateDto: UpdateSubscriptionAppDto = {
      name: 'Updated Name',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId, updateDto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId, updateDto)).rejects.toThrow(
      `Failed to update subscription with id ${subscriptionId}`,
    );
  });
});
