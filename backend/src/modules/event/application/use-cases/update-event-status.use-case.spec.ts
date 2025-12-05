import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateEventStatusUseCase } from './update-event-status.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event, EventStatus } from '../../domain/event.entity';

describe('UpdateEventStatusUseCase', () => {
  let useCase: UpdateEventStatusUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEventStatusUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateEventStatusUseCase>(UpdateEventStatusUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('Valid status transitions', () => {
    it('should update status from scheduled to completed', async () => {
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

      const updatedEvent = new Event({
        id: eventId,
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'completed',
        createdAt: existingEvent.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await useCase.execute(eventId, 'completed');

      expect(result.status).toBe('completed');
      expect(repository.findById).toHaveBeenCalledWith(eventId);
      expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
    });

    it('should update status from scheduled to canceled', async () => {
      const eventId = 'event-456';
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
        status: 'canceled',
        createdAt: existingEvent.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await useCase.execute(eventId, 'canceled');

      expect(result.status).toBe('canceled');
    });

    it('should update status from scheduled to failed', async () => {
      const eventId = 'event-789';
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
        status: 'failed',
        createdAt: existingEvent.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await useCase.execute(eventId, 'failed');

      expect(result.status).toBe('failed');
    });

    it('should update status from failed to scheduled (reschedule)', async () => {
      const eventId = 'event-999';
      const existingEvent = new Event({
        id: eventId,
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'failed',
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
        createdAt: existingEvent.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await useCase.execute(eventId, 'scheduled');

      expect(result.status).toBe('scheduled');
    });
  });

  describe('Invalid status transitions', () => {
    it('should throw BadRequestException when trying to transition from completed', async () => {
      const eventId = 'event-111';
      const existingEvent = new Event({
        id: eventId,
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-01-01'),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);

      await expect(useCase.execute(eventId, 'scheduled')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(eventId, 'scheduled')).rejects.toThrow(
        "Cannot transition from 'completed' to 'scheduled'",
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to transition from canceled', async () => {
      const eventId = 'event-222';
      const existingEvent = new Event({
        id: eventId,
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'canceled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);

      await expect(useCase.execute(eventId, 'scheduled')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(eventId, 'scheduled')).rejects.toThrow(
        "Cannot transition from 'canceled' to 'scheduled'",
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying invalid transition from failed to completed', async () => {
      const eventId = 'event-333';
      const existingEvent = new Event({
        id: eventId,
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingEvent);

      await expect(useCase.execute(eventId, 'completed')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(eventId, 'completed')).rejects.toThrow(
        "Cannot transition from 'failed' to 'completed'",
      );
    });
  });

  describe('Error cases', () => {
    it('should throw NotFoundException when event does not exist', async () => {
      const eventId = 'non-existent-id';
      const status: EventStatus = 'completed';

      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(eventId, status)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(eventId, status)).rejects.toThrow(
        `Event with ID ${eventId} not found`,
      );

      expect(repository.findById).toHaveBeenCalledWith(eventId);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when update fails', async () => {
      const eventId = 'event-444';
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
      repository.update.mockResolvedValue(null);

      await expect(useCase.execute(eventId, 'completed')).rejects.toThrow(NotFoundException);

      expect(repository.findById).toHaveBeenCalledWith(eventId);
      expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
    });
  });

  it('should call updateStatus method on event entity', async () => {
    const eventId = 'event-555';
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

    const updateStatusSpy = jest.spyOn(existingEvent, 'updateStatus');

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-01'),
      status: 'completed',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    await useCase.execute(eventId, 'completed');

    expect(updateStatusSpy).toHaveBeenCalledWith('completed');
  });
});
