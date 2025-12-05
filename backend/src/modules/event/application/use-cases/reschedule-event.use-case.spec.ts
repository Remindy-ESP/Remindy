import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RescheduleEventUseCase } from './reschedule-event.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { RescheduleEventAppDto } from '../dto/reschedule-event-app.dto';

describe('RescheduleEventUseCase', () => {
  let useCase: RescheduleEventUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<RescheduleEventUseCase>(RescheduleEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should reschedule an event successfully', async () => {
    const eventId = 'event-123';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
      endsAt: new Date('2025-03-15T23:59:59'),
    };

    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-15'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      status: 'scheduled',
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, dto);

    expect(result.startsAt).toEqual(dto.startsAt);
    expect(result.endsAt).toEqual(dto.endsAt);
    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).toHaveBeenCalledWith(eventId, existingEvent);
  });

  it('should reschedule event and update notes', async () => {
    const eventId = 'event-123';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
      notes: 'Rescheduled due to holidays',
    };

    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-15'),
      status: 'scheduled',
      notes: 'Original note',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: dto.startsAt,
      status: 'scheduled',
      notes: dto.notes,
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, dto);

    expect(result.notes).toBe(dto.notes);
    expect(repository.update).toHaveBeenCalled();
  });

  it('should reschedule event without changing notes when not provided', async () => {
    const eventId = 'event-123';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
    };

    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-15'),
      status: 'scheduled',
      notes: 'Keep this note',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: dto.startsAt,
      status: 'scheduled',
      notes: existingEvent.notes,
      createdAt: existingEvent.createdAt,
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, dto);

    expect(result.notes).toBe('Keep this note');
  });

  it('should throw NotFoundException when event does not exist', async () => {
    const eventId = 'non-existent';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
    };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(eventId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, dto)).rejects.toThrow(
      `Event with id ${eventId} not found`,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when update fails', async () => {
    const eventId = 'event-123';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
    };

    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-15'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(eventId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, dto)).rejects.toThrow(
      `Failed to reschedule event with id ${eventId}`,
    );
  });

  it('should throw error when endsAt is before startsAt', async () => {
    const eventId = 'event-123';
    const dto: RescheduleEventAppDto = {
      startsAt: new Date('2025-03-15'),
      endsAt: new Date('2025-03-10'), // Before startsAt
    };

    const existingEvent = new Event({
      id: eventId,
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: new Date('2025-02-15'),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.findById.mockResolvedValue(existingEvent);

    await expect(useCase.execute(eventId, dto)).rejects.toThrow(
      'End date must be after start date',
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
