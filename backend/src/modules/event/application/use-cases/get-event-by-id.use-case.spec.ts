import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetEventByIdUseCase } from './get-event-by-id.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';

describe('GetEventByIdUseCase', () => {
  let useCase: GetEventByIdUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventByIdUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetEventByIdUseCase>(GetEventByIdUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return an event by id', async () => {
    const eventId = 'event-123';
    const expectedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(expectedEvent);

    const result = await useCase.execute(eventId);

    expect(result).toBe(expectedEvent);
    expect(result.id).toBe(eventId);
    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when event does not exist', async () => {
    const eventId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(eventId)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId)).rejects.toThrow(`Event with ID ${eventId} not found`);

    expect(repository.findById).toHaveBeenCalledWith(eventId);
  });

  it('should return a scheduled event', async () => {
    const eventId = 'event-456';
    const scheduledEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Scheduled Payment',
      amount: 9.99,
      startsAt: new Date('2025-03-01'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(scheduledEvent);

    const result = await useCase.execute(eventId);

    expect(result.status).toBe('scheduled');
    expect(result.id).toBe(eventId);
  });

  it('should return a completed event with payment status', async () => {
    const eventId = 'event-789';
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

    const result = await useCase.execute(eventId);

    expect(result.status).toBe('completed');
    expect(result.paymentStatus).toBe('paid');
  });

  it('should return an event with all optional fields', async () => {
    const eventId = 'event-999';
    const eventWithAllFields = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      eventSeriesId: 'series-456',
      title: 'Payment with all fields',
      amount: 19.99,
      startsAt: new Date('2025-02-01'),
      endsAt: new Date('2025-02-01T23:59:59'),
      status: 'completed',
      paymentStatus: 'paid',
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(eventWithAllFields);

    const result = await useCase.execute(eventId);

    expect(result.id).toBe(eventId);
    expect(result.eventSeriesId).toBe('series-456');
    expect(result.endsAt).toBeDefined();
    expect(result.notes).toBe('Test notes');
  });

  it('should return a canceled event', async () => {
    const eventId = 'event-111';
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

    const result = await useCase.execute(eventId);

    expect(result.status).toBe('canceled');
  });

  it('should return a failed event', async () => {
    const eventId = 'event-222';
    const failedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Failed Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'failed',
      paymentStatus: 'failed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(failedEvent);

    const result = await useCase.execute(eventId);

    expect(result.status).toBe('failed');
    expect(result.paymentStatus).toBe('failed');
  });
});
