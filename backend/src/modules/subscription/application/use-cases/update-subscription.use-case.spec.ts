import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateSubscriptionUseCase } from './update-subscription.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { EVENT_REPOSITORY } from 'src/modules/event/application/ports/event-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { UpdateSubscriptionAppDto } from '../dto/update-subscription-app.dto';
import { UpdateFutureEventsStatusUseCase } from 'src/modules/event/application/use-cases/update-future-events-status.use-case';
import { SubscriptionEventGeneratorService } from '../services/subscription-event-generator.service';

describe('UpdateSubscriptionUseCase', () => {
  let useCase: UpdateSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;
  let updateFutureEventsStatusUseCase: { execute: jest.Mock };
  let mockEventRepository: {
    cancelEventsAfterDate: jest.Mock;
    updateFutureEventsStatus: jest.Mock;
    cancelScheduledEventOnDate: jest.Mock;
  };
  let mockEventGeneratorService: {
    generateEventsForSubscription: jest.Mock;
    calculateOccurrencesCount: jest.Mock;
  };

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    updateFutureEventsStatusUseCase = {
      execute: jest.fn().mockResolvedValue(0),
    };

    mockEventRepository = {
      cancelEventsAfterDate: jest.fn().mockResolvedValue(0),
      updateFutureEventsStatus: jest.fn().mockResolvedValue(0),
      cancelScheduledEventOnDate: jest.fn().mockResolvedValue(0),
    };

    mockEventGeneratorService = {
      generateEventsForSubscription: jest.fn().mockResolvedValue([]),
      calculateOccurrencesCount: jest.fn().mockReturnValue(10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepository,
        },
        {
          provide: UpdateFutureEventsStatusUseCase,
          useValue: updateFutureEventsStatusUseCase,
        },
        {
          provide: SubscriptionEventGeneratorService,
          useValue: mockEventGeneratorService,
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

  it('should update contractId and categoryId', async () => {
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
      contractId: 42,
      categoryId: 'cat-1',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.contractId).toBe(42);
    expect(existingSubscription.categoryId).toBe('cat-1');
  });

  it('should update currency and frequency', async () => {
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
      currency: 'USD',
      frequency: 'yearly',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.currency).toBe('USD');
    expect(existingSubscription.frequency).toBe('yearly');
  });

  it('should update dates', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    });

    const newStartDate = new Date('2025-03-01');
    const newNextDueDate = new Date('2025-04-01');
    const newEndDate = new Date('2026-01-01');

    const updateDto: UpdateSubscriptionAppDto = {
      startDate: newStartDate,
      nextDueDate: newNextDueDate,
      endDate: newEndDate,
    };

    const updatedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: newStartDate,
      nextDueDate: newNextDueDate,
      endDate: newEndDate,
      status: 'active',
    });

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(updatedSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.startDate).toEqual(newStartDate);
    expect(existingSubscription.nextDueDate).toEqual(newNextDueDate);
    expect(existingSubscription.endDate).toEqual(newEndDate);
    // Les événements planifiés après la nouvelle endDate doivent être annulés
    expect(mockEventRepository.cancelEventsAfterDate).toHaveBeenCalledWith(
      subscriptionId,
      newEndDate,
    );
    // Les événements manquants pour la période étendue doivent être générés
    expect(mockEventGeneratorService.generateEventsForSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ subscription: updatedSubscription, count: 10 }),
    );
  });

  it('should generate new events when endDate is extended', async () => {
    const subscriptionId = 'subscription-123';
    const oldEndDate = new Date('2026-05-01');
    const newEndDate = new Date('2026-09-01');

    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 250,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      endDate: oldEndDate,
      status: 'active',
    });

    const updatedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 250,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      endDate: newEndDate,
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = { endDate: newEndDate };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(updatedSubscription);
    mockEventGeneratorService.calculateOccurrencesCount.mockReturnValue(9);

    await useCase.execute(subscriptionId, updateDto);

    // cancelEventsAfterDate doit être appelé (noop si aucun événement au-delà)
    expect(mockEventRepository.cancelEventsAfterDate).toHaveBeenCalledWith(
      subscriptionId,
      newEndDate,
    );
    // generateEventsForSubscription doit être appelé avec le bon count
    expect(mockEventGeneratorService.calculateOccurrencesCount).toHaveBeenCalledWith(
      updatedSubscription.startDate,
      updatedSubscription.frequency,
      newEndDate,
    );
    expect(mockEventGeneratorService.generateEventsForSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ subscription: updatedSubscription, count: 9 }),
    );
  });

  it('should cancel all future events and regenerate when startDate changes', async () => {
    const subscriptionId = 'subscription-123';
    const oldStartDate = new Date('2026-01-01');
    const newStartDate = new Date('2026-03-15');

    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: oldStartDate,
      nextDueDate: new Date('2026-02-01'),
      status: 'active',
    });

    const updatedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: newStartDate,
      nextDueDate: new Date('2026-04-15'),
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = {
      startDate: newStartDate,
      nextDueDate: new Date('2026-04-15'),
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(updatedSubscription);

    await useCase.execute(subscriptionId, updateDto);

    // Tous les événements futurs doivent être annulés pour repartir sur une base propre
    expect(mockEventRepository.updateFutureEventsStatus).toHaveBeenCalledWith(
      subscriptionId,
      'canceled',
    );
    // L'événement à l'ANCIENNE date de début doit aussi être annulé (même s'il est dans le passé)
    expect(mockEventRepository.cancelScheduledEventOnDate).toHaveBeenCalledWith(
      subscriptionId,
      oldStartDate,
    );
    // Le calendrier est régénéré depuis la nouvelle date de début
    expect(mockEventGeneratorService.generateEventsForSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ subscription: updatedSubscription }),
    );
  });

  it('should cancel all future events and regenerate when frequency changes', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      status: 'active',
    });

    const updatedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'yearly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2027-01-01'),
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = { frequency: 'yearly' };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(updatedSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(mockEventRepository.updateFutureEventsStatus).toHaveBeenCalledWith(
      subscriptionId,
      'canceled',
    );
    expect(mockEventGeneratorService.generateEventsForSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ subscription: updatedSubscription }),
    );
  });

  it('should not cancel all future events when only endDate changes', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      status: 'active',
    });

    const newEndDate = new Date('2026-09-01');
    const updatedSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 100,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      endDate: newEndDate,
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = { endDate: newEndDate };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(updatedSubscription);

    await useCase.execute(subscriptionId, updateDto);

    // Seul cancelEventsAfterDate doit être appelé, pas updateFutureEventsStatus
    expect(mockEventRepository.updateFutureEventsStatus).not.toHaveBeenCalled();
    expect(mockEventRepository.cancelEventsAfterDate).toHaveBeenCalledWith(subscriptionId, newEndDate);
  });

  it('should not call cancelEventsAfterDate when endDate is not in the update', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    });

    const updateDto: UpdateSubscriptionAppDto = { name: 'Updated Name' };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(mockEventRepository.cancelEventsAfterDate).not.toHaveBeenCalled();
  });

  it('should update trial dates', async () => {
    const subscriptionId = 'subscription-123';
    const existingSubscription = new Subscription({
      id: subscriptionId,
      userId: 'user-123',
      name: 'Test',
      amount: 10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    });

    const trialStart = new Date('2025-01-01');
    const trialEnd = new Date('2025-01-31');

    const updateDto: UpdateSubscriptionAppDto = {
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.trialStartDate).toEqual(trialStart);
    expect(existingSubscription.trialEndDate).toEqual(trialEnd);
  });

  it('should update color and notes', async () => {
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
      color: '#0000FF',
      notes: 'Updated notes',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.color).toBe('#0000FF');
    expect(existingSubscription.notes).toBe('Updated notes');
  });

  it('should update status to trial and not update future events', async () => {
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
      status: 'trial',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(existingSubscription.status).toBe('trial');
  });

  it('should update status to paused and update future events to canceled', async () => {
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
      status: 'paused',
    };

    repository.findById.mockResolvedValue(existingSubscription);
    repository.update.mockResolvedValue(existingSubscription);

    await useCase.execute(subscriptionId, updateDto);

    expect(updateFutureEventsStatusUseCase.execute).toHaveBeenCalledWith(
      subscriptionId,
      'canceled',
    );
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
