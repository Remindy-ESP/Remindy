import { Test, TestingModule } from '@nestjs/testing';
import { FindSubscriptionEventsUseCase } from './find-subscription-events.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('FindSubscriptionEventsUseCase', () => {
  let useCase: FindSubscriptionEventsUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;
  let eventRepository: any;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      findById: jest.fn(),
    };

    const mockEventRepository = {
      findBySubscriptionId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSubscriptionEventsUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindSubscriptionEventsUseCase>(FindSubscriptionEventsUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
    eventRepository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should find all events for a subscription', async () => {
    const subscriptionId = 'subscription-123';

    const subscription = new Subscription({
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

    const mockEvents = [
      {
        id: 'event-1',
        subscriptionId,
        eventSeriesId: 'series-1',
        title: 'Netflix Payment',
        amount: 15.99,
        startsAt: new Date('2025-01-01'),
        endsAt: new Date('2025-01-01'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Monthly payment',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'event-2',
        subscriptionId,
        eventSeriesId: 'series-1',
        title: 'Netflix Payment',
        amount: 15.99,
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-02-01'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Monthly payment',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    repository.findById.mockResolvedValue(subscription);
    eventRepository.findBySubscriptionId.mockResolvedValue(mockEvents);

    const result = await useCase.execute(subscriptionId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('event-1');
    expect(result[0].subscriptionId).toBe(subscriptionId);
    expect(result[1].id).toBe('event-2');
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith(subscriptionId);
  });

  it('should throw NotFoundException when subscription does not exist', async () => {
    const subscriptionId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(subscriptionId)).rejects.toThrow(
      `Subscription with id ${subscriptionId} not found`,
    );
    expect(eventRepository.findBySubscriptionId).not.toHaveBeenCalled();
  });

  it('should return empty array when subscription has no events', async () => {
    const subscriptionId = 'subscription-123';

    const subscription = new Subscription({
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

    repository.findById.mockResolvedValue(subscription);
    eventRepository.findBySubscriptionId.mockResolvedValue([]);

    const result = await useCase.execute(subscriptionId);

    expect(result).toEqual([]);
    expect(repository.findById).toHaveBeenCalledWith(subscriptionId);
    expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith(subscriptionId);
  });

  it('should map event properties correctly', async () => {
    const subscriptionId = 'subscription-123';

    const subscription = new Subscription({
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

    const mockEvent = {
      id: 'event-1',
      subscriptionId,
      eventSeriesId: 'series-1',
      title: 'Netflix Payment',
      amount: 15.99,
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2025-01-01'),
      status: 'scheduled',
      paymentStatus: 'paid',
      notes: 'Paid via credit card',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.findById.mockResolvedValue(subscription);
    eventRepository.findBySubscriptionId.mockResolvedValue([mockEvent]);

    const result = await useCase.execute(subscriptionId);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: mockEvent.id,
      subscriptionId: mockEvent.subscriptionId,
      eventSeriesId: mockEvent.eventSeriesId,
      title: mockEvent.title,
      amount: mockEvent.amount,
      startsAt: mockEvent.startsAt,
      endsAt: mockEvent.endsAt,
      status: mockEvent.status,
      paymentStatus: mockEvent.paymentStatus,
      notes: mockEvent.notes,
      createdAt: mockEvent.createdAt,
      updatedAt: mockEvent.updatedAt,
    });
  });

  it('should handle repository errors', async () => {
    const subscriptionId = 'subscription-123';
    const error = new Error('Database error');

    repository.findById.mockRejectedValue(error);

    await expect(useCase.execute(subscriptionId)).rejects.toThrow('Database error');
  });
});
