import { Test, TestingModule } from '@nestjs/testing';
import { CreateEventUseCase, CreateEventDto } from './create-event.use-case';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';

describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      create: jest.fn(),
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateEventUseCase>(CreateEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create an event with minimal required fields', async () => {
      const dto: CreateEventDto = {
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
      };

      const expectedEvent = new Event({
        id: 'event-123',
        subscriptionId: dto.subscriptionId,
        title: dto.title,
        amount: dto.amount,
        startsAt: dto.startsAt,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(expectedEvent);

      const result = await useCase.execute(dto);

      expect(result).toBe(expectedEvent);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: dto.subscriptionId,
          title: dto.title,
          amount: dto.amount,
          startsAt: dto.startsAt,
          status: 'scheduled',
        }),
      );
    });

    it('should create an event with all optional fields', async () => {
      const dto: CreateEventDto = {
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-456',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-02-01T23:59:59'),
        status: 'completed',
        paymentStatus: 'paid',
        notes: 'Test notes',
      };

      const expectedEvent = new Event({
        id: 'event-123',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      repository.create.mockResolvedValue(expectedEvent);

      const result = await useCase.execute(dto);

      expect(result).toBe(expectedEvent);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: dto.subscriptionId,
          eventSeriesId: dto.eventSeriesId,
          title: dto.title,
          amount: dto.amount,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          status: dto.status,
          paymentStatus: dto.paymentStatus,
          notes: dto.notes,
        }),
      );
    });

    it('should default status to scheduled when not provided', async () => {
      const dto: CreateEventDto = {
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
      };

      const expectedEvent = new Event({
        id: 'event-123',
        subscriptionId: dto.subscriptionId,
        title: dto.title,
        amount: dto.amount,
        startsAt: dto.startsAt,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(expectedEvent);

      await useCase.execute(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'scheduled',
        }),
      );
    });

    it('should create an event with custom status', async () => {
      const dto: CreateEventDto = {
        subscriptionId: 'sub-123',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
        status: 'canceled',
      };

      const expectedEvent = new Event({
        id: 'event-123',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      repository.create.mockResolvedValue(expectedEvent);

      await useCase.execute(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
        }),
      );
    });

    it('should create an event with event series id', async () => {
      const dto: CreateEventDto = {
        subscriptionId: 'sub-123',
        eventSeriesId: 'series-789',
        title: 'Monthly Payment',
        amount: 9.99,
        startsAt: new Date('2025-02-01'),
      };

      const expectedEvent = new Event({
        id: 'event-123',
        ...dto,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(expectedEvent);

      const result = await useCase.execute(dto);

      expect(result.eventSeriesId).toBe('series-789');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventSeriesId: 'series-789',
        }),
      );
    });
  });

  describe('createMany', () => {
    it('should create multiple events', async () => {
      const dtos: CreateEventDto[] = [
        {
          subscriptionId: 'sub-123',
          title: 'Payment 1',
          amount: 9.99,
          startsAt: new Date('2025-02-01'),
        },
        {
          subscriptionId: 'sub-123',
          title: 'Payment 2',
          amount: 9.99,
          startsAt: new Date('2025-03-01'),
        },
        {
          subscriptionId: 'sub-456',
          title: 'Payment 3',
          amount: 19.99,
          startsAt: new Date('2025-02-15'),
        },
      ];

      const expectedEvents = dtos.map(
        (dto, index) =>
          new Event({
            id: `event-${index}`,
            ...dto,
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      );

      repository.createMany.mockResolvedValue(expectedEvents);

      const result = await useCase.createMany(dtos);

      expect(result).toBe(expectedEvents);
      expect(result).toHaveLength(3);
      expect(repository.createMany).toHaveBeenCalledTimes(1);
      expect(repository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            subscriptionId: 'sub-123',
            title: 'Payment 1',
            amount: 9.99,
          }),
          expect.objectContaining({
            subscriptionId: 'sub-123',
            title: 'Payment 2',
            amount: 9.99,
          }),
          expect.objectContaining({
            subscriptionId: 'sub-456',
            title: 'Payment 3',
            amount: 19.99,
          }),
        ]),
      );
    });

    it('should create multiple events with all optional fields', async () => {
      const dtos: CreateEventDto[] = [
        {
          subscriptionId: 'sub-123',
          eventSeriesId: 'series-1',
          title: 'Payment 1',
          amount: 9.99,
          startsAt: new Date('2025-02-01'),
          endsAt: new Date('2025-02-01T23:59:59'),
          status: 'completed',
          paymentStatus: 'paid',
          notes: 'First payment',
        },
        {
          subscriptionId: 'sub-123',
          eventSeriesId: 'series-1',
          title: 'Payment 2',
          amount: 9.99,
          startsAt: new Date('2025-03-01'),
          endsAt: new Date('2025-03-01T23:59:59'),
          status: 'scheduled',
          paymentStatus: 'pending',
          notes: 'Second payment',
        },
      ];

      const expectedEvents = dtos.map(
        (dto, index) =>
          new Event({
            id: `event-${index}`,
            ...dto,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any),
      );

      repository.createMany.mockResolvedValue(expectedEvents);

      const result = await useCase.createMany(dtos);

      expect(result).toHaveLength(2);
      expect(result[0].eventSeriesId).toBe('series-1');
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('scheduled');
    });

    it('should create empty array when no dtos provided', async () => {
      const dtos: CreateEventDto[] = [];

      repository.createMany.mockResolvedValue([]);

      const result = await useCase.createMany(dtos);

      expect(result).toEqual([]);
      expect(repository.createMany).toHaveBeenCalledWith([]);
    });

    it('should default status to scheduled for all events', async () => {
      const dtos: CreateEventDto[] = [
        {
          subscriptionId: 'sub-123',
          title: 'Payment 1',
          amount: 9.99,
          startsAt: new Date('2025-02-01'),
        },
        {
          subscriptionId: 'sub-123',
          title: 'Payment 2',
          amount: 9.99,
          startsAt: new Date('2025-03-01'),
          status: 'canceled',
        },
      ];

      const expectedEvents = dtos.map(
        (dto, index) =>
          new Event({
            id: `event-${index}`,
            ...dto,
            status: dto.status || 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      );

      repository.createMany.mockResolvedValue(expectedEvents);

      await useCase.createMany(dtos);

      expect(repository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: 'scheduled' }),
          expect.objectContaining({ status: 'canceled' }),
        ]),
      );
    });
  });
});
