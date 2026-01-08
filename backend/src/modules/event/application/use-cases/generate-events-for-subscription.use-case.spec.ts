import { Test, TestingModule } from '@nestjs/testing';
import { GenerateEventsForSubscriptionUseCase } from './generate-events-for-subscription.use-case';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { Event } from '../../domain/event.entity';

describe('GenerateEventsForSubscriptionUseCase', () => {
  let useCase: GenerateEventsForSubscriptionUseCase;
  let eventRepository: any;

  beforeEach(async () => {
    const mockEventRepository = {
      findBySubscriptionId: jest.fn(),
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateEventsForSubscriptionUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    useCase = module.get<GenerateEventsForSubscriptionUseCase>(
      GenerateEventsForSubscriptionUseCase,
    );
    eventRepository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create new events for occurrences with no existing events', async () => {
      const dto = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Netflix',
        subscriptionAmount: 15.99,
        eventSeriesId: 'series-123',
        occurrences: [
          { startsAt: new Date('2024-01-15T10:00:00Z') },
          { startsAt: new Date('2024-02-15T10:00:00Z') },
          { startsAt: new Date('2024-03-15T10:00:00Z') },
        ],
      };

      eventRepository.findBySubscriptionId.mockResolvedValue([]);

      const mockCreatedEvents = dto.occurrences.map(
        occ =>
          new Event({
            id: `event-${occ.startsAt.getTime()}`,
            subscriptionId: dto.subscriptionId,
            eventSeriesId: dto.eventSeriesId,
            title: `Paiement ${dto.subscriptionName}`,
            amount: dto.subscriptionAmount,
            startsAt: occ.startsAt,
            status: 'scheduled',
            paymentStatus: 'pending',
          }),
      );

      eventRepository.createMany.mockResolvedValue(mockCreatedEvents);

      const result = await useCase.execute(dto);

      expect(result).toHaveLength(3);
      expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(eventRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            subscriptionId: 'sub-123',
            title: 'Paiement Netflix',
            amount: 15.99,
            status: 'scheduled',
            paymentStatus: 'pending',
          }),
        ]),
      );
      expect(eventRepository.createMany).toHaveBeenCalledTimes(1);
    });

    it('should filter out occurrences that already have events on the same date', async () => {
      const dto = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Spotify',
        subscriptionAmount: 9.99,
        eventSeriesId: 'series-456',
        occurrences: [
          { startsAt: new Date('2024-01-15T10:00:00Z') },
          { startsAt: new Date('2024-02-15T10:00:00Z') },
          { startsAt: new Date('2024-03-15T10:00:00Z') },
        ],
      };

      // Existing event on 2024-01-15 (should be filtered out)
      const existingEvents = [
        new Event({
          id: 'existing-1',
          subscriptionId: 'sub-123',
          eventSeriesId: 'series-456',
          title: 'Paiement Spotify',
          amount: 9.99,
          startsAt: new Date('2024-01-15T08:00:00Z'), // Different time, same date
          status: 'scheduled',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(existingEvents);
      eventRepository.createMany.mockResolvedValue([]);

      const result = await useCase.execute(dto);

      // Should only create 2 new events (Feb and Mar), not Jan
      expect(eventRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            startsAt: new Date('2024-02-15T10:00:00Z'),
          }),
          expect.objectContaining({
            startsAt: new Date('2024-03-15T10:00:00Z'),
          }),
        ]),
      );

      const createdEvents = eventRepository.createMany.mock.calls[0][0];
      expect(createdEvents).toHaveLength(2);
      expect(createdEvents.find((e: Event) =>
        e.startsAt.toISOString().startsWith('2024-01-15')
      )).toBeUndefined();
    });

    it('should return empty array when all occurrences already have events', async () => {
      const dto = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Amazon Prime',
        subscriptionAmount: 12.99,
        eventSeriesId: 'series-789',
        occurrences: [
          { startsAt: new Date('2024-01-15T10:00:00Z') },
          { startsAt: new Date('2024-02-15T10:00:00Z') },
        ],
      };

      // All dates already have events
      const existingEvents = [
        new Event({
          id: 'existing-1',
          subscriptionId: 'sub-123',
          eventSeriesId: 'series-789',
          title: 'Paiement Amazon Prime',
          amount: 12.99,
          startsAt: new Date('2024-01-15T12:00:00Z'),
          status: 'scheduled',
        }),
        new Event({
          id: 'existing-2',
          subscriptionId: 'sub-123',
          eventSeriesId: 'series-789',
          title: 'Paiement Amazon Prime',
          amount: 12.99,
          startsAt: new Date('2024-02-15T12:00:00Z'),
          status: 'scheduled',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(existingEvents);

      const result = await useCase.execute(dto);

      expect(result).toEqual([]);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('should return empty array when occurrences list is empty', async () => {
      const dto = {
        subscriptionId: 'sub-123',
        subscriptionName: 'Disney+',
        subscriptionAmount: 7.99,
        eventSeriesId: 'series-abc',
        occurrences: [],
      };

      eventRepository.findBySubscriptionId.mockResolvedValue([]);

      const result = await useCase.execute(dto);

      expect(result).toEqual([]);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('should handle multiple existing events and filter correctly', async () => {
      const dto = {
        subscriptionId: 'sub-456',
        subscriptionName: 'HBO Max',
        subscriptionAmount: 14.99,
        eventSeriesId: 'series-xyz',
        occurrences: [
          { startsAt: new Date('2024-01-10T10:00:00Z') },
          { startsAt: new Date('2024-01-20T10:00:00Z') },
          { startsAt: new Date('2024-02-10T10:00:00Z') },
          { startsAt: new Date('2024-02-20T10:00:00Z') },
          { startsAt: new Date('2024-03-10T10:00:00Z') },
        ],
      };

      // Existing events on 2024-01-10 and 2024-02-20
      const existingEvents = [
        new Event({
          id: 'existing-1',
          subscriptionId: 'sub-456',
          eventSeriesId: 'series-xyz',
          title: 'Paiement HBO Max',
          amount: 14.99,
          startsAt: new Date('2024-01-10T15:00:00Z'), // Same date, different time
          status: 'completed',
        }),
        new Event({
          id: 'existing-2',
          subscriptionId: 'sub-456',
          eventSeriesId: 'series-xyz',
          title: 'Paiement HBO Max',
          amount: 14.99,
          startsAt: new Date('2024-02-20T15:00:00Z'),
          status: 'scheduled',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(existingEvents);
      eventRepository.createMany.mockResolvedValue([]);

      await useCase.execute(dto);

      const createdEvents = eventRepository.createMany.mock.calls[0][0];
      expect(createdEvents).toHaveLength(3);

      // Should create events for Jan 20, Feb 10, and Mar 10
      const createdDates = createdEvents.map((e: Event) =>
        e.startsAt.toISOString().split('T')[0]
      );
      expect(createdDates).toContain('2024-01-20');
      expect(createdDates).toContain('2024-02-10');
      expect(createdDates).toContain('2024-03-10');
      expect(createdDates).not.toContain('2024-01-10');
      expect(createdDates).not.toContain('2024-02-20');
    });

    it('should set correct event properties when creating events', async () => {
      const dto = {
        subscriptionId: 'sub-999',
        subscriptionName: 'YouTube Premium',
        subscriptionAmount: 11.99,
        eventSeriesId: 'series-premium',
        occurrences: [{ startsAt: new Date('2024-06-01T10:00:00Z') }],
      };

      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      eventRepository.createMany.mockImplementation((events) => Promise.resolve(events));

      await useCase.execute(dto);

      const createdEvents = eventRepository.createMany.mock.calls[0][0];
      expect(createdEvents[0]).toMatchObject({
        subscriptionId: 'sub-999',
        eventSeriesId: 'series-premium',
        title: 'Paiement YouTube Premium',
        amount: 11.99,
        startsAt: new Date('2024-06-01T10:00:00Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
      });
    });

    it('should handle dates across different timezones correctly', async () => {
      const dto = {
        subscriptionId: 'sub-tz',
        subscriptionName: 'Test Subscription',
        subscriptionAmount: 5.99,
        eventSeriesId: 'series-tz',
        occurrences: [
          { startsAt: new Date('2024-01-15T00:00:00Z') },
          { startsAt: new Date('2024-01-15T23:59:59Z') },
        ],
      };

      // Existing event at different time on same UTC date
      const existingEvents = [
        new Event({
          id: 'existing-tz',
          subscriptionId: 'sub-tz',
          eventSeriesId: 'series-tz',
          title: 'Test',
          amount: 5.99,
          startsAt: new Date('2024-01-15T12:00:00Z'),
          status: 'scheduled',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(existingEvents);

      const result = await useCase.execute(dto);

      // Both occurrences are on 2024-01-15, so both should be filtered
      expect(result).toEqual([]);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });
  });
});
