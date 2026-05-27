import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteEventUseCase } from './delete-event.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';

describe('DeleteEventUseCase', () => {
  let useCase: DeleteEventUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteEventUseCase>(DeleteEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete an existing event', async () => {
    const eventId = 'event-123';
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

    repository.findById.mockResolvedValue(existingEvent);
    repository.delete.mockResolvedValue(true);

    await useCase.execute(eventId);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith(eventId);
    expect(repository.delete).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when event does not exist', async () => {
    const eventId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(eventId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId)).rejects.toThrow(`Event with ID ${eventId} not found`);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should delete a completed event', async () => {
    const eventId = 'event-456';
    const completedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Completed Payment',
      amount: 9.99,
      startsAt: new Date('2025-01-01'),
      status: 'completed',
      paymentStatus: 'paid',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(completedEvent);
    repository.delete.mockResolvedValue(true);

    await useCase.execute(eventId);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.delete).toHaveBeenCalledWith(eventId);
  });

  it('should delete a canceled event', async () => {
    const eventId = 'event-789';
    const canceledEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Canceled Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'canceled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(canceledEvent);
    repository.delete.mockResolvedValue(true);

    await useCase.execute(eventId);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.delete).toHaveBeenCalledWith(eventId);
  });

  it('should delete an event with event series id', async () => {
    const eventId = 'event-999';
    const eventWithSeries = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      eventSeriesId: 'series-456',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(eventWithSeries);
    repository.delete.mockResolvedValue(true);

    await useCase.execute(eventId);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.delete).toHaveBeenCalledWith(eventId);
  });
});
