import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateSubscriptionUseCase } from './update-subscription.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { UpdateSubscriptionAppDto } from '../dto/update-subscription-app.dto';
import { UpdateFutureEventsStatusUseCase } from 'src/modules/event/application/use-cases/update-future-events-status.use-case';

describe('UpdateSubscriptionUseCase', () => {
  let useCase: UpdateSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;
  let updateFutureEventsStatusUseCase: jest.Mocked<UpdateFutureEventsStatusUseCase>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockUpdateFutureEventsStatusUseCase = {
      execute: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: UpdateFutureEventsStatusUseCase,
          useValue: mockUpdateFutureEventsStatusUseCase,
        },
      ],
    }).compile();

    useCase = module.get<UpdateSubscriptionUseCase>(UpdateSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
    updateFutureEventsStatusUseCase = module.get(UpdateFutureEventsStatusUseCase);
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
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
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

  it('should update subscription status to active', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date(),
      nextDueDate: new Date(),
      status: 'paused',
    });

    const updateDto: UpdateSubscriptionAppDto = {
      status: 'active',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.status).toBe('active');
  });

  it('should update subscription status to cancelled', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date(),
      nextDueDate: new Date(),
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = {
      status: 'cancelled',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.status).toBe('cancelled');
  });

  it('should throw error when update fails', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date(),
      nextDueDate: new Date(),
      status: 'active',
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
