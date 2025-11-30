import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateEventPaymentStatusUseCase } from './update-event-payment-status.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event, PaymentStatus } from '../../domain/event.entity';

describe('UpdateEventPaymentStatusUseCase', () => {
  let useCase: UpdateEventPaymentStatusUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEventPaymentStatusUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateEventPaymentStatusUseCase>(UpdateEventPaymentStatusUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update payment status from pending to paid', async () => {
    const eventId = 'event-123';
    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'paid',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, 'paid');

    expect(result.paymentStatus).toBe('paid');
    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('should update payment status to failed', async () => {
    const eventId = 'event-456';
    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'failed',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, 'failed');

    expect(result.paymentStatus).toBe('failed');
    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
  });

  it('should throw NotFoundException when event does not exist', async () => {
    const eventId = 'non-existent-id';
    const paymentStatus: PaymentStatus = 'paid';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(eventId, paymentStatus)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, paymentStatus)).rejects.toThrow(
      `Event with ID ${eventId} not found`,
    );

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when update fails', async () => {
    const eventId = 'event-789';
    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(eventId, 'paid')).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, 'paid')).rejects.toThrow(
      `Failed to update event with ID ${eventId}`,
    );

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
  });

  it('should update payment status to pending', async () => {
    const eventId = 'event-999';
    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'pending',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, 'pending');

    expect(result.paymentStatus).toBe('pending');
  });

  it('should call updatePaymentStatus method on event entity', async () => {
    const eventId = 'event-111';
    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatePaymentStatusSpy = jest.spyOn(existingEvent, 'updatePaymentStatus');

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      paymentStatus: 'paid',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    await useCase.execute(eventId, 'paid');

    expect(updatePaymentStatusSpy).toHaveBeenCalledWith('paid');
  });
});
