import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RescheduleEventUseCase } from './reschedule-event.use-case';
import { IEventRepository, EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';
import { RescheduleEventAppDto } from '../dto/reschedule-event-app.dto';
import { makeEventDomain } from '../../__fixtures__/event.fixtures';

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
    const eventId = 'evt-1';
    const event = makeEventDomain({ id: eventId });
    const newStartsAt = new Date('2025-03-01T10:00:00.000Z');
    const dto: RescheduleEventAppDto = { startsAt: newStartsAt };
    const updatedEvent = makeEventDomain({ id: eventId, startsAt: newStartsAt });

    repository.findById.mockResolvedValue(event);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, dto);

    expect(result).toBe(updatedEvent);
    expect(repository.findById).toHaveBeenCalledWith(eventId);
    expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
  });

  it('should reschedule an event with endsAt and notes', async () => {
    const eventId = 'evt-1';
    const event = makeEventDomain({ id: eventId });
    const newStartsAt = new Date('2025-03-01T10:00:00.000Z');
    const newEndsAt = new Date('2025-03-01T11:00:00.000Z');
    const dto: RescheduleEventAppDto = {
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      notes: 'Rescheduled due to conflict',
    };
    const updatedEvent = makeEventDomain({ id: eventId, startsAt: newStartsAt });

    repository.findById.mockResolvedValue(event);
    repository.update.mockResolvedValue(updatedEvent);

    const result = await useCase.execute(eventId, dto);

    expect(result).toBe(updatedEvent);
    expect(repository.update).toHaveBeenCalledWith(eventId, expect.any(Event));
  });

  it('should throw NotFoundException when event does not exist', async () => {
    const eventId = 'non-existent';
    const dto: RescheduleEventAppDto = { startsAt: new Date('2025-03-01') };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(eventId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, dto)).rejects.toThrow(
      `Event with id ${eventId} not found`,
    );
  });

  it('should throw NotFoundException when update returns null', async () => {
    const eventId = 'evt-1';
    const dto: RescheduleEventAppDto = { startsAt: new Date('2025-03-01') };

    repository.findById.mockImplementation(() => Promise.resolve(makeEventDomain({ id: eventId })));
    repository.update.mockResolvedValue(null);

    await expect(useCase.execute(eventId, dto)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(eventId, dto)).rejects.toThrow(
      `Failed to reschedule event with id ${eventId}`,
    );
  });

  it('should propagate repository errors', async () => {
    const eventId = 'evt-1';
    const dto: RescheduleEventAppDto = { startsAt: new Date('2025-03-01') };

    repository.findById.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(eventId, dto)).rejects.toThrow('Database error');
  });
});
